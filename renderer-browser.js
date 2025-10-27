// Browser version - no Electron dependencies

// State management
let isRecording = false;
let captureInterval = null;
let startTime = null;
let durationInterval = null;
let captures = [];
let extractedTexts = [];
let transcribedTexts = [];
let recognition = null;
let audioContext = null;
let audioAnalyser = null;
let currentAudioLevel = 0;
let currentMode = 'visual';

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
const recordingModeSelect = document.getElementById('recordingMode');
const audioIndicator = document.getElementById('audioIndicator');
const audioLevelFill = document.getElementById('audioLevelFill');
const audioLevelText = document.getElementById('audioLevelText');
const modeBadge = document.getElementById('modeBadge');
const audioWordCountEl = document.getElementById('audioWordCount');

let generatedNotes = '';

// Event listeners
startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
generateBtn.addEventListener('click', generateNotes);
quizBtn.addEventListener('click', generateQuiz);
copyBtn.addEventListener('click', copyNotes);
copyQuizBtn.addEventListener('click', copyQuiz);

// Audio transcription setup
async function setupAudioTranscription(stream) {
    const audioTracks = stream.getAudioTracks();
    
    if (audioTracks.length > 0) {
        console.log('Audio track detected:', audioTracks[0].label);
        
        try {
            audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            audioAnalyser = audioContext.createAnalyser();
            audioAnalyser.fftSize = 256;
            source.connect(audioAnalyser);
            setInterval(updateAudioLevel, 100);
        } catch (error) {
            console.warn('Audio analysis setup failed:', error);
        }
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    const transcript = event.results[i][0].transcript;
                    transcribedTexts.push(transcript);
                    const wordCount = transcribedTexts.join(' ').split(/\s+/).length;
                    audioWordCountEl.textContent = `${wordCount} words`;
                    console.log('Transcribed:', transcript);
                }
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
            if (isRecording && (currentMode === 'audio' || currentMode === 'both')) {
                try {
                    recognition.start();
                } catch (e) {
                    console.log('Recognition restart failed');
                }
            }
        };
        
        return true;
    }
    return false;
}

function startTranscription() {
    if (recognition) {
        try {
            recognition.start();
            audioIndicator.classList.add('active');
            modeBadge.textContent = '🎤 Transcribing';
            modeBadge.className = 'audio-mode-badge badge-transcribing';
            console.log('Transcription started');
        } catch (error) {
            console.error('Failed to start transcription:', error);
        }
    }
}

function stopTranscription() {
    if (recognition) {
        recognition.stop();
        audioIndicator.classList.remove('active');
    }
}

function startScreenshots(video) {
    const intervalSeconds = parseInt(captureIntervalInput.value) || 20;
    captureInterval = setInterval(() => {
        captureScreenshot(video);
    }, intervalSeconds * 1000);
    console.log(`Screenshots started. Interval: ${intervalSeconds}s`);
}

function updateAudioLevel() {
    if (!audioAnalyser) return;

    const bufferLength = audioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    audioAnalyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
    }
    const average = sum / bufferLength;
    currentAudioLevel = average / 255;

    audioLevelFill.style.width = `${currentAudioLevel * 100}%`;
    audioLevelText.textContent = `${Math.round(currentAudioLevel * 100)}%`;
}

function checkAudioLevel() {
    if (!isRecording || recordingModeSelect.value !== 'auto') return;

    const threshold = 0.1;

    if (currentAudioLevel > threshold && currentMode === 'visual') {
        console.log('Audio detected! Switching to transcription...');
        currentMode = 'audio';
        if (captureInterval) {
            clearInterval(captureInterval);
            captureInterval = null;
        }
        startTranscription();
    } else if (currentAudioLevel <= threshold && currentMode === 'audio') {
        console.log('Audio stopped. Switching to screenshots...');
        currentMode = 'visual';
        stopTranscription();
        const video = document.querySelector('video');
        if (video) startScreenshots(video);
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,  // Request audio!
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
            }
        });
        
        const hasAudio = stream.getAudioTracks().length > 0;
        console.log('Audio track available:', hasAudio);
        
        if (!hasAudio) {
            console.warn('No audio. Make sure to select Chrome tab and check "Share audio"');
        }

        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;  // MUTE THE VIDEO ELEMENT - prevents feedback!
        video.play();

        await new Promise(resolve => {
            video.onloadedmetadata = resolve;
        });

        isRecording = true;
        startTime = Date.now();
        captures = [];
        extractedTexts = [];
        transcribedTexts = [];
        
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
        audioWordCountEl.textContent = '0 words';

        durationInterval = setInterval(updateDuration, 1000);
        await setupAudioTranscription(stream);

        const selectedMode = recordingModeSelect.value;
        if (selectedMode === 'audio') {
            currentMode = 'audio';
            startTranscription();
        } else if (selectedMode === 'both') {
            currentMode = 'both';
            startTranscription();
            startScreenshots(video);
        } else if (selectedMode === 'auto') {
            currentMode = 'visual';
            startScreenshots(video);
            setInterval(() => checkAudioLevel(), 2000);
        } else {
            currentMode = 'visual';
            startScreenshots(video);
        }

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

    if (recognition) {
        recognition.stop();
        recognition = null;
    }

    audioIndicator.classList.remove('active');

    startBtn.disabled = false;
    stopBtn.disabled = true;
    generateBtn.disabled = captures.length === 0 && transcribedTexts.length === 0;
    statusEl.textContent = 'Stopped';

    const totalContent = captures.length + transcribedTexts.length;
    if (totalContent > 0) {
        notesContent.textContent = `Recording complete! Captured ${captures.length} screenshots and ${transcribedTexts.length} audio segments. Click "Generate Notes" to process.`;
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
        captures.push({ data: imageData, timestamp: timestamp });

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
            headers: { 'Content-Type': 'application/json' },
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
    if (extractedTexts.length === 0 && transcribedTexts.length === 0) {
        alert('No content captured.');
        return;
    }

    generateBtn.disabled = true;
    quizBtn.disabled = true;
    notesContent.innerHTML = '<div class="loading"><div class="spinner"></div>Processing with local AI...</div>';

    try {
        let combinedText = '';
        
        if (extractedTexts.length > 0) {
            combinedText += '=== TEXT FROM SCREENSHOTS ===\n\n';
            combinedText += extractedTexts.join('\n\n---\n\n');
        }
        
        if (transcribedTexts.length > 0) {
            if (combinedText) combinedText += '\n\n';
            combinedText += '=== TRANSCRIBED AUDIO ===\n\n';
            combinedText += transcribedTexts.join(' ');
        }
        
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.1:8b',
                prompt: `Create comprehensive study notes from:\n\n${combinedText}\n\nInclude: Summary, Key Concepts, Important Details`,
                stream: false
            })
        });

        const result = await response.json();
        
        if (result.response) {
            generatedNotes = result.response;
            notesContent.textContent = generatedNotes;
            copyBtn.style.display = 'inline-block';
            quizBtn.disabled = false;
            quizSettings.style.display = 'flex';
        } else {
            throw new Error('No response from AI');
        }
    } catch (error) {
        notesContent.textContent = `Error: ${error.message}\n\nMake sure Ollama is running.`;
    } finally {
        generateBtn.disabled = false;
    }
}

function copyNotes() {
    navigator.clipboard.writeText(notesContent.textContent).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
    });
}

async function generateQuiz() {
    if (!generatedNotes) {
        alert('Generate notes first.');
        return;
    }
    
    quizBtn.disabled = true;
    quizSection.style.display = 'block';
    quizContent.innerHTML = '<div class="loading"><div class="spinner"></div>Generating quiz...</div>';
    
    const questionCount = parseInt(quizCountInput.value) || 10;
    const difficulty = quizDifficultySelect.value;
    
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.1:8b',
                prompt: `Create ${questionCount} ${difficulty} quiz questions from:\n\n${generatedNotes}`,
                stream: false
            })
        });
        
        const result = await response.json();
        if (result.response) {
            quizContent.textContent = result.response;
            copyQuizBtn.style.display = 'inline-block';
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

console.log('✅ QuikSnap loaded in Chrome - Audio capture enabled!');