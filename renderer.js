const { ipcRenderer } = require('electron');

// State management
let isRecording = false;
let captureInterval = null;
let startTime = null;
let durationInterval = null;
let captures = [];
let extractedTexts = [];

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const generateBtn = document.getElementById('generateBtn');
const quizBtn = document.getElementById('quizBtn');
const copyBtn = document.getElementById('copyBtn');
const copyQuizBtn = document.getElementById('copyQuizBtn');
const statusEl = document.getElementById('status');
const captureCountEl = document.getElementById('captureCount');
const durationEl = document.getElementById('duration');
const textCountEl = document.getElementById('textCount');
const previewGrid = document.getElementById('previewGrid');
const notesContent = document.getElementById('notesContent');
const quizContent = document.getElementById('quizContent');
const quizSection = document.getElementById('quizSection');
const quizSettings = document.getElementById('quizSettings');
const captureIntervalInput = document.getElementById('captureInterval');
const quizCountInput = document.getElementById('quizCount');
const quizDifficultySelect = document.getElementById('quizDifficulty');

let generatedNotes = ''; // Store notes for quiz generation

// Event listeners
startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
generateBtn.addEventListener('click', generateNotes);
quizBtn.addEventListener('click', generateQuiz);
copyBtn.addEventListener('click', copyNotes);
copyQuizBtn.addEventListener('click', copyQuiz);

async function startRecording() {
    try {
        // Get screen sources
        const sources = await ipcRenderer.invoke('get-sources');
        if (!sources || sources.length === 0) {
            alert('No screen sources found. Please check permissions.');
            return;
        }

        // Use the primary screen
        const primaryScreen = sources[0];
        
        // Get media stream
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: primaryScreen.id,
                    minWidth: 1280,
                    maxWidth: 1920,
                    minHeight: 720,
                    maxHeight: 1080
                }
            }
        });

        // Setup video element for capturing
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        // Wait for video to load
        await new Promise(resolve => {
            video.onloadedmetadata = resolve;
        });

        // Start recording state
        isRecording = true;
        startTime = Date.now();
        captures = [];
        extractedTexts = [];
        
        // Update UI
        startBtn.disabled = true;
        stopBtn.disabled = false;
        generateBtn.disabled = true;
        quizBtn.disabled = true;
        statusEl.innerHTML = 'Recording <span class="recording-indicator"></span>';
        previewGrid.innerHTML = '';
        notesContent.textContent = 'Recording in progress...';
        quizContent.textContent = 'Complete recording and generate notes first...';
        copyBtn.style.display = 'none';
        copyQuizBtn.style.display = 'none';
        quizSection.style.display = 'none';
        quizSettings.style.display = 'none';

        // Start duration counter
        durationInterval = setInterval(updateDuration, 1000);

        // Set interval for regular captures - waits for first interval before capturing
        const intervalSeconds = parseInt(captureIntervalInput.value) || 20;
        captureInterval = setInterval(() => {
            captureScreenshot(video);
        }, intervalSeconds * 1000);

        console.log(`Recording started. First capture in ${intervalSeconds} seconds...`);

    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Failed to start recording. Error: ' + error.message);
        resetRecording();
    }
}

function stopRecording() {
    isRecording = false;
    
    if (captureInterval) {
        clearInterval(captureInterval);
        captureInterval = null;
    }
    
    if (durationInterval) {
        clearInterval(durationInterval);
        durationInterval = null;
    }

    // Update UI
    startBtn.disabled = false;
    stopBtn.disabled = true;
    generateBtn.disabled = captures.length === 0;
    statusEl.textContent = 'Stopped';

    if (captures.length > 0) {
        notesContent.textContent = `Recording complete! Captured ${captures.length} screenshots with ${extractedTexts.length} text extractions. Click "Generate Notes" to process.`;
    }
}

async function captureScreenshot(video) {
    if (!isRecording) return;

    try {
        // Create canvas to capture frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Get image as base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Store capture
        const timestamp = Date.now() - startTime;
        captures.push({
            data: imageData,
            timestamp: timestamp
        });

        // Update preview
        updatePreview(imageData, timestamp);

        // Extract text via OCR
        extractText(imageData);

        // Update count
        captureCountEl.textContent = captures.length;

    } catch (error) {
        console.error('Error capturing screenshot:', error);
    }
}

function updatePreview(imageData, timestamp) {
    // Keep only last 6 previews visible
    if (previewGrid.children.length >= 6) {
        previewGrid.removeChild(previewGrid.firstChild);
    }

    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    
    const img = document.createElement('img');
    img.src = imageData;
    
    const time = document.createElement('div');
    time.className = 'timestamp';
    time.textContent = formatTime(timestamp);
    
    previewItem.appendChild(img);
    previewItem.appendChild(time);
    previewGrid.appendChild(previewItem);
}

async function extractText(imageData) {
    try {
        const response = await fetch('http://localhost:5001/ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData })
        });

        const result = await response.json();
        
        if (result.success && result.text && result.text.trim().length > 20) {
            // Check if similar to previous text (avoid duplicates)
            const isDuplicate = extractedTexts.some(prevText => 
                calculateSimilarity(prevText, result.text) > 0.85
            );

            if (!isDuplicate) {
                extractedTexts.push(result.text);
                const wordCount = extractedTexts.join(' ').split(/\s+/).length;
                textCountEl.textContent = `${wordCount} words`;
            }
        }
    } catch (error) {
        console.error('OCR extraction failed:', error);
        // Continue without OCR if service is unavailable
    }
}

async function generateNotes() {
    if (extractedTexts.length === 0) {
        alert('No text was extracted from the captures. Make sure the OCR service is running and there is visible text in your captures.');
        return;
    }

    generateBtn.disabled = true;
    quizBtn.disabled = true;
    notesContent.innerHTML = '<div class="loading"><div class="spinner"></div>Processing with local AI model...<br><small>This may take 30-60 seconds</small></div>';

    try {
        // Combine all extracted text
        const combinedText = extractedTexts.join('\n\n---\n\n');
        
        // Send to local Ollama
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3.1:8b',
                prompt: `You are a study assistant. Create comprehensive, well-organized study notes from the following lecture/study session content. Format with clear sections, bullet points for key concepts, and highlight important information.

Content:
${combinedText}

Create detailed study notes with:
1. Summary
2. Key Concepts
3. Important Details
4. Action Items (if applicable)`,
                stream: false
            })
        });

        const result = await response.json();
        
        if (result.response) {
            generatedNotes = result.response; // Store for quiz generation
            notesContent.textContent = generatedNotes;
            copyBtn.style.display = 'inline-block';
            quizBtn.disabled = false; // Enable quiz button
            quizSettings.style.display = 'flex'; // Show quiz settings
        } else {
            throw new Error('No response from AI model');
        }

    } catch (error) {
        console.error('Error generating notes:', error);
        notesContent.textContent = `Error generating notes: ${error.message}\n\nMake sure Ollama is running:\n1. Open terminal\n2. Run: ollama serve\n3. Try again\n\nRaw extracted text:\n\n${extractedTexts.join('\n\n---\n\n')}`;
    } finally {
        generateBtn.disabled = false;
    }
}

function copyNotes() {
    const text = notesContent.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    });
}

async function generateQuiz() {
    if (!generatedNotes) {
        alert('Please generate notes first before creating a quiz.');
        return;
    }
    
    quizBtn.disabled = true;
    quizSection.style.display = 'block';
    quizContent.innerHTML = '<div class="loading"><div class="spinner"></div>Generating quiz questions...</div>';
    
    const questionCount = parseInt(quizCountInput.value) || 10;
    const difficulty = quizDifficultySelect.value;
    
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.1:8b',
                prompt: `Based on these study notes, create ${questionCount} ${difficulty} difficulty quiz questions.

Study Notes:
${generatedNotes}

Generate exactly ${questionCount} questions in this format:
Q1: [Question]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct Answer: [Letter]
Explanation: [Brief explanation]

Mix of question types: multiple choice, true/false, and short answer.
Make questions test understanding, not just memorization.
`,
                stream: false
            })
        });
        
        const result = await response.json();
        if (result.response) {
            quizContent.textContent = result.response;
            copyQuizBtn.style.display = 'inline-block';
        } else {
            throw new Error('No response from AI');
        }
    } catch (error) {
        quizContent.textContent = `Error generating quiz: ${error.message}\n\nMake sure Ollama is running.`;
    } finally {
        quizBtn.disabled = false;
    }
}

function copyQuiz() {
    navigator.clipboard.writeText(quizContent.textContent).then(() => {
        const originalText = copyQuizBtn.textContent;
        copyQuizBtn.textContent = '✅ Copied!';
        setTimeout(() => { copyQuizBtn.textContent = originalText; }, 2000);
    });
}

function updateDuration() {
    if (!startTime) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    durationEl.textContent = formatTime(elapsed * 1000);
}

function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function calculateSimilarity(str1, str2) {
    // Simple similarity check based on word overlap
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
}

function resetRecording() {
    isRecording = false;
    if (captureInterval) clearInterval(captureInterval);
    if (durationInterval) clearInterval(durationInterval);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusEl.textContent = 'Ready';
}

// Check services on startup
async function checkServices() {
    try {
        // Check OCR service
        const ocrResponse = await fetch('http://localhost:5001/health');
        if (!ocrResponse.ok) throw new Error('OCR service not responding');
        
        // Check Ollama
        const ollamaResponse = await fetch('http://localhost:11434/api/tags');
        if (!ollamaResponse.ok) throw new Error('Ollama not responding');
        
        console.log('✅ All services ready');
    } catch (error) {
        console.warn('⚠️ Service check failed:', error.message);
        alert('Warning: Some services may not be running.\n\nMake sure:\n1. OCR service is running (python ocr-service/ocr_server.py)\n2. Ollama is running (ollama serve)');
    }
}

// Run service check after a short delay
setTimeout(checkServices, 1000);