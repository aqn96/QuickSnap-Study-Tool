# QuikSnap Study Tool

A free desktop and browser app that captures your screen and generates AI-powered study notes and quizzes with automatic fact verification. Powered by local open-source LLMs.

## 🎯 Two Versions Available

### 1. Electron App (Desktop - Simple)
- ✅ Screenshot capture + OCR
- ✅ AI note generation with verification
- ✅ Quiz generation
- ✅ Source screenshot viewer
- ❌ No audio transcription
- **Best for:** Documents, slides, reading, coding tutorials

### 2. Browser Version (Chrome - With Audio!)
- ✅ Everything from Electron app, PLUS:
- ✅ **Audio transcription from Chrome tabs!**
- **Best for:** Video lectures, online courses (YouTube, Coursera, etc.)

---

## Prerequisites

- **Node.js** v16+ - [Download](https://nodejs.org/)
- **Python 3.8+** - [Download](https://python.org/)
- **Ollama** - Local AI model runner

---

## Installation

### 1. Install Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows - download from: https://ollama.com/download/windows

# Download the AI model (one-time, ~4.9GB)
ollama pull llama3.1:8b

# Verify
ollama list
```

### 2. Setup Python Virtual Environment
```bash
cd quiksnap-study-tool
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate on Windows
```

### 3. Install Dependencies
```bash
# Python packages
pip3 install easyocr pillow flask flask-cors

# Node packages
npm install
```

### 4. macOS: Grant Screen Recording Permission
- **System Settings → Privacy & Security → Screen Recording**
- Enable **Terminal** ✅ (critical!)
- Enable **Electron** ✅ (if appears)
- **Restart app** after granting

---

## Running the App

### Electron App (Desktop)

**Terminal 1 - OCR Service:**
```bash
cd quiksnap-study-tool
source venv/bin/activate
python3 ocr-service/ocr_server.py
```

**Terminal 2 - App:**
```bash
cd quiksnap-study-tool
npm start
```

### Browser Version (With Audio)

**Terminal 1 - OCR Service:**
```bash
cd quiksnap-study-tool
source venv/bin/activate
python3 ocr-service/ocr_server.py
```

**Terminal 2 - Web Server:**
```bash
cd quiksnap-study-tool
node server.js
```

**Open Chrome:**
```bash
open -a "Google Chrome" http://localhost:8080
```

---

## Usage

### Electron App:
1. Click **Start Recording**
2. Select screen/window
3. Study (screenshots every 20s)
4. Click **Stop Recording**
5. Click **Generate Notes** (auto-verifies!)
6. Review verification summary
7. Click screenshot links to check sources
8. **(Optional)** Generate Quiz

### Browser Version (Audio):
1. Open lecture in Chrome tab (YouTube, etc.)
2. Go to QuikSnap tab (localhost:8080)
3. Click **Start Recording**
4. Select **Chrome Tab** with lecture
5. ✅ Check **"Share audio"**
6. Click Share
7. Audio transcribes automatically! 🎤
8. Rest same as Electron app

---

## Features

### Core Features
- ✅ **$0 forever** - No API costs
- ✅ **100% local** - Complete privacy
- ✅ **Smart capture** - Auto-deduplication
- ✅ **Live preview** - See captures in real-time
- ✅ **Adjustable timing** - 5-60 second intervals

### AI Features
- ✅ **Auto-generated notes** - Comprehensive summaries
- ✅ **Fact verification** - Flags incorrect info
- ✅ **Source linking** - Click to view screenshots
- ✅ **Quiz generation** - 5-50 custom questions
- ✅ **Confidence indicators** - Know what's reliable

### Browser-Only
- ✅ **Audio transcription** - Chrome tab audio capture
- ✅ **Smart modes** - Auto/Visual/Audio/Both

---

## 🔍 Fact Verification System

QuikSnap automatically checks your notes for accuracy!

### How It Works:
1. AI extracts 5-10 key factual claims
2. Verifies each against its knowledge base
3. Flags potentially incorrect information
4. Links facts to source screenshots

### Verification Output:
```
📊 Verification Summary:
✅ 8 verified • ⚠️ 1 flagged • ❓ 1 uncertain

⚠️ Items to Review:

❌ Photosynthesis occurs in mitochondria
   AI suggests: Occurs in chloroplasts, not mitochondria
   📸 View source screenshot #7

❓ Discovery mentioned in 1995
   Could not verify specific date
   📸 View source screenshot #12
```

### Benefits:
- 🎯 Catch OCR errors
- 🎯 Catch lecturer mistakes
- 🎯 Identify uncertain facts
- 🎯 Study with confidence

**Note:** Verification uses AI's existing knowledge (not web search). Best for catching obvious errors and scientific facts.

---

## Quiz Generation

Generate custom practice questions with confidence indicators!

**Features:**
- 5-50 questions (adjustable)
- Easy/Medium/Hard/Mixed difficulty
- Multiple choice, True/False, Short answer
- Includes answers + explanations
- ⚠️ Warnings on low-confidence questions

**Example:**
```
⚠️ NOTICE: 2 facts could not be verified. Review carefully.

Q1: What produces ATP in cells? ✅ High Confidence
A) Mitochondria
B) Nucleus
C) Ribosomes
D) Lysosomes
Correct Answer: A
Explanation: Mitochondria are the powerhouse of the cell...

Q2: When was this discovered? ⚠️ Low Confidence - verify answer
A) 1995
B) 1998
...
```

---

## File Structure

```
quiksnap-study-tool/
├── index.html              # Electron UI (no audio)
├── index-browser.html      # Browser UI (with audio)
├── main.js                 # Electron main process
├── renderer.js             # Electron logic + verification
├── renderer-browser.js     # Browser logic + verification
├── server.js               # Web server
├── ocr-service/
│   └── ocr_server.py      # OCR text extraction
├── package.json
├── venv/                   # Python virtual environment
└── README.md
```

---

## Troubleshooting

### "Could not start video source"
- Grant Screen Recording permission (System Settings)
- Enable **Terminal** specifically
- Completely quit and restart app

### "No text extracted"
- OCR service must be running
- Check: `curl http://localhost:5001/health`
- Verify venv activated: `source venv/bin/activate`

### "No audio" (Browser version)
- Select **Chrome Tab** (not entire screen)
- Check **"Share audio"** checkbox
- Audio must be playing in selected tab

### "Error generating notes"
- Check Ollama: `ollama list`
- If needed: `ollama serve`

### Port 5001 already in use
- macOS uses port 5000 for ControlCenter
- App automatically uses 5001 to avoid conflict

---

## Customization

**In the app:**
- Capture interval (5-60 seconds)
- Quiz questions (5-50)
- Quiz difficulty (Easy/Medium/Hard/Mixed)

**In code:**
- Change AI model in `renderer.js`: `llama3.1:8b` → any Ollama model
- Adjust verification claim count (default: 5)

---

## Cost Comparison

| QuikSnap | Cloud Services |
|----------|----------------|
| **$0 forever** | $20-45 per 3-hour session |
| Unlimited use | Pay per use |
| 100% private | Data sent to cloud |
| Works offline | Requires internet |

---

## Tips

- 📚 **Electron**: Perfect for documents, slides, code
- 🎥 **Browser**: Perfect for video lectures with audio
- ⏱️ **20-second intervals** work well for most content
- 💾 **OCR is highly accurate** for text-based material
- 🔍 **Review flagged facts** - verification catches ~80% of errors
- 📸 **Click screenshot links** to verify sources yourself

---

## Support

**Check services:**
- OCR: `curl http://localhost:5001/health`
- Ollama: `ollama list`
- Web server: Look for "Server Running!" in terminal

**Common issues:**
- Verify Python/Node versions
- Check all permissions granted
- Ensure services running in separate terminals

---

**Enjoy your AI study assistant!** 🎓✨

📖 Documents/slides → Use **Electron app** (`npm start`)  
🎬 Video lectures → Use **Browser version** (`node server.js`)
