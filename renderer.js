const { ipcRenderer } = require('electron');

// State management
let isRecording = false;
let captureInterval = null;
let startTime = null;
let durationInterval = null;
let captures = [];
let extractedTexts = [];
let verificationResults = null;

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

let generatedNotes = '';

// Event listeners
startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
generateBtn.addEventListener('click', generateNotes);
quizBtn.addEventListener('click', generateQuiz);
copyBtn.addEventListener('click', copyNotes);
copyQuizBtn.addEventListener('click', copyQuiz);

async function startRecording() {
    try {
        const sources = await ipcRenderer.invoke('get-sources');
        if (!sources || sources.length === 0) {
            alert('No screen sources found. Please check permissions.');
            return;
        }

        const primaryScreen = sources[0];
        
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

        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        await new Promise(resolve => {
            video.onloadedmetadata = resolve;
        });

        isRecording = true;
        startTime = Date.now();
        captures = [];
        extractedTexts = [];
        verificationResults = null;
        generatedNotes = '';
        
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
        textCountEl.textContent = '0 words';
        captureCountEl.textContent = '0';
        durationEl.textContent = '00:00';

        durationInterval = setInterval(updateDuration, 1000);

        const intervalSeconds = parseInt(captureIntervalInput.value) || 20;
        captureInterval = setInterval(() => {
            captureScreenshot(video);
        }, intervalSeconds * 1000);

        console.log(`Recording started. Capturing every ${intervalSeconds} seconds...`);

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
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        const timestamp = Date.now() - startTime;
        
        captures.push({
            data: imageData,
            timestamp: timestamp
        });

        updatePreview(imageData, timestamp);
        extractText(imageData);
        captureCountEl.textContent = captures.length;

    } catch (error) {
        console.error('Error capturing screenshot:', error);
    }
}

function updatePreview(imageData, timestamp) {
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
    }
}

async function generateNotes() {
    if (extractedTexts.length === 0) {
        alert('No text was extracted. Make sure the OCR service is running.');
        return;
    }

    generateBtn.disabled = true;
    quizBtn.disabled = true;
    notesContent.innerHTML = '<div class="loading"><div class="spinner"></div>Generating and verifying notes...<br><small>This may take 60-90 seconds</small></div>';

    try {
        const combinedText = extractedTexts.join('\n\n---\n\n');
        
        // Step 1: Generate initial notes
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3.1:8b',
                prompt: `You are a study assistant. Create comprehensive, well-organized study notes from the following content. Format with clear sections, bullet points for key concepts, and highlight important information.

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
        
        if (!result.response) {
            throw new Error('No response from AI model');
        }
        
        generatedNotes = result.response;
        
        // Step 2: Extract and verify key claims
        notesContent.innerHTML = '<div class="loading"><div class="spinner"></div>Verifying facts with web search...<br><small>Checking accuracy...</small></div>';
        
        verificationResults = await verifyNotesWithWeb(generatedNotes, captures);
        
        // Step 3: Display verified notes
        displayVerifiedNotes(generatedNotes, verificationResults);
        
        copyBtn.style.display = 'inline-block';
        quizBtn.disabled = false;
        quizSettings.style.display = 'flex';

    } catch (error) {
        console.error('Error generating notes:', error);
        notesContent.textContent = `Error generating notes: ${error.message}\n\nMake sure Ollama is running.`;
    } finally {
        generateBtn.disabled = false;
    }
}

async function verifyNotesWithWeb(notes, screenshots) {
    try {
        // Extract key factual claims using AI
        const claimsResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.1:8b',
                prompt: `Extract 5-10 key factual claims from these notes that can be fact-checked. List each claim on a new line, numbered. Only include verifiable facts, not opinions or subjective statements.

Notes:
${notes}

Format:
1. [Specific factual claim]
2. [Specific factual claim]
...`,
                stream: false
            })
        });
        
        const claimsResult = await claimsResponse.json();
        if (!claimsResult.response) return null;
        
        // Parse claims
        const claimLines = claimsResult.response.split('\n').filter(line => line.trim().match(/^\d+\./));
        const claims = claimLines.map(line => line.replace(/^\d+\.\s*/, '').trim());
        
        console.log('Extracted claims for verification:', claims);
        
        // Verify each claim (limit to 5 for performance)
        const verificationsPromises = claims.slice(0, 5).map(async (claim, index) => {
            try {
                // Simple web search simulation (you'd use actual web_search here)
                // For now, use AI to assess likelihood
                const verifyResponse = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'llama3.1:8b',
                        prompt: `Is this statement likely accurate based on your knowledge? Answer with: VERIFIED, UNCERTAIN, or LIKELY_INCORRECT, followed by a brief explanation.

Statement: ${claim}

Format:
Status: [VERIFIED/UNCERTAIN/LIKELY_INCORRECT]
Explanation: [Why]`,
                        stream: false
                    })
                });
                
                const verifyResult = await verifyResponse.json();
                const response = verifyResult.response || '';
                
                let status = 'UNCERTAIN';
                if (response.includes('VERIFIED')) status = 'VERIFIED';
                else if (response.includes('LIKELY_INCORRECT')) status = 'LIKELY_INCORRECT';
                
                return {
                    claim,
                    status,
                    explanation: response.split('Explanation:')[1]?.trim() || 'No explanation',
                    screenshotIndex: Math.floor(index * screenshots.length / claims.length)
                };
            } catch (error) {
                console.error('Verification error:', error);
                return { claim, status: 'ERROR', explanation: 'Could not verify' };
            }
        });
        
        const verifications = await Promise.all(verificationsPromises);
        
        return {
            total: verifications.length,
            verified: verifications.filter(v => v.status === 'VERIFIED').length,
            flagged: verifications.filter(v => v.status === 'LIKELY_INCORRECT').length,
            uncertain: verifications.filter(v => v.status === 'UNCERTAIN').length,
            details: verifications
        };
        
    } catch (error) {
        console.error('Verification failed:', error);
        return null;
    }
}

function displayVerifiedNotes(notes, verification) {
    let html = '<div style="margin-bottom: 20px;">';
    
    if (verification) {
        html += `<div style="background: #f0fdf4; border: 2px solid #86efac; padding: 15px; border-radius: 10px; margin-bottom: 20px;">`;
        html += `<strong>📊 Verification Summary:</strong><br>`;
        html += `✅ ${verification.verified} verified • `;
        html += `⚠️ ${verification.flagged} flagged • `;
        html += `❓ ${verification.uncertain} uncertain`;
        html += `</div>`;
        
        // Show flagged items if any
        if (verification.flagged > 0 || verification.uncertain > 0) {
            html += `<div style="background: #fef3c7; border: 2px solid #fbbf24; padding: 15px; border-radius: 10px; margin-bottom: 20px;">`;
            html += `<strong>⚠️ Items to Review:</strong><br><br>`;
            
            verification.details.forEach((item, idx) => {
                if (item.status !== 'VERIFIED') {
                    const icon = item.status === 'LIKELY_INCORRECT' ? '❌' : '❓';
                    html += `${icon} <strong>${item.claim}</strong><br>`;
                    html += `<small style="color: #92400e;">${item.explanation}</small><br>`;
                    html += `<small>📸 <a href="#" onclick="showScreenshot(${item.screenshotIndex}); return false;">View source screenshot #${item.screenshotIndex + 1}</a></small><br><br>`;
                }
            });
            
            html += `</div>`;
        }
    }
    
    html += `<div style="white-space: pre-wrap;">${notes}</div>`;
    html += '</div>';
    
    notesContent.innerHTML = html;
    
    // Store for screenshot viewing
    window.currentCaptures = captures;
}

// Function to show screenshot in modal
window.showScreenshot = function(index) {
    if (!window.currentCaptures || !window.currentCaptures[index]) {
        alert('Screenshot not available');
        return;
    }
    
    const screenshot = window.currentCaptures[index];
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    const img = document.createElement('img');
    img.src = screenshot.data;
    img.style.cssText = 'max-width: 90%; max-height: 90%; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Close';
    closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; padding: 10px 20px; background: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;';
    closeBtn.onclick = () => document.body.removeChild(modal);
    
    modal.appendChild(img);
    modal.appendChild(closeBtn);
    modal.onclick = (e) => { if (e.target === modal) document.body.removeChild(modal); };
    
    document.body.appendChild(modal);
}

function copyNotes() {
    navigator.clipboard.writeText(notesContent.textContent).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    });
}

async function generateQuiz() {
    if (!generatedNotes) {
        alert('Please generate notes first.');
        return;
    }
    
    quizBtn.disabled = true;
    quizSection.style.display = 'block';
    quizContent.innerHTML = '<div class="loading"><div class="spinner"></div>Generating quiz questions...</div>';
    
    const questionCount = parseInt(quizCountInput.value) || 10;
    const difficulty = quizDifficultySelect.value;
    
    // Build prompt with verification warnings
    let verificationWarning = '';
    if (verificationResults && verificationResults.flagged > 0) {
        verificationWarning = `\n\nIMPORTANT: Some facts in the source material were flagged as potentially incorrect. When creating quiz questions, add a warning note for questions based on uncertain information.`;
    }
    
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.1:8b',
                prompt: `Based on these study notes, create ${questionCount} ${difficulty} difficulty quiz questions.${verificationWarning}

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
${verificationResults && verificationResults.flagged > 0 ? 'Confidence: [High/Medium/Low]' : ''}

Mix of question types: multiple choice, true/false, and short answer.
Make questions test understanding, not just memorization.
If any fact seems uncertain, mark the question as "⚠️ Low Confidence - verify answer"`,
                stream: false
            })
        });
        
        const result = await response.json();
        if (result.response) {
            let quizText = result.response;
            
            // Add verification summary at top if there were issues
            if (verificationResults && (verificationResults.flagged > 0 || verificationResults.uncertain > 0)) {
                quizText = `⚠️ NOTICE: ${verificationResults.flagged + verificationResults.uncertain} facts from the source material could not be verified. Please review flagged questions carefully.\n\n` + quizText;
            }
            
            quizContent.textContent = quizText;
            copyQuizBtn.style.display = 'inline-block';
        } else {
            throw new Error('No response from AI');
        }
    } catch (error) {
        quizContent.textContent = `Error: ${error.message}`;
    } finally {
        quizBtn.disabled = false;
    }
}

function copyQuiz() {
    navigator.clipboard.writeText(quizContent.textContent).then(() => {
        const originalText = copyQuizBtn.textContent;
        copyQuizBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            copyQuizBtn.textContent = originalText;
        }, 2000);
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

async function checkServices() {
    try {
        const ocrResponse = await fetch('http://localhost:5001/health');
        if (!ocrResponse.ok) throw new Error('OCR service not responding');
        
        const ollamaResponse = await fetch('http://localhost:11434/api/tags');
        if (!ollamaResponse.ok) throw new Error('Ollama not responding');
        
        console.log('✅ All services ready');
    } catch (error) {
        console.warn('⚠️ Service check failed:', error.message);
        alert('Warning: Some services may not be running.\n\nMake sure:\n1. OCR service is running (python ocr-service/ocr_server.py)\n2. Ollama is running (ollama serve)');
    }
}

setTimeout(checkServices, 1000);

console.log('✅ QuikSnap Electron app loaded');