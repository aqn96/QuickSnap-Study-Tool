# QuikSnap Study Tool

A free desktop and browser app that captures your screen and generates AI-powered study notes and quizzes.

## 🎯 Two Versions Available

### 1. **Electron App** (Desktop - Simple)
- ✅ Screenshot capture + OCR
- ✅ AI note generation
- ✅ Quiz generation
- ❌ No audio transcription
- **Best for:** Documents, slides, reading

### 2. **Browser Version** (Chrome - With Audio!)
- ✅ Screenshot capture + OCR
- ✅ AI note generation
- ✅ Quiz generation
- ✅ **Audio transcription from Chrome tabs!**
- **Best for:** Video lectures, online courses

---

## Electron App (Desktop Version)

### Prerequisites

- **Node.js** (v16 or higher)
- **Python 3.8+**
- **Ollama** - Local AI model

### Installation

#### 1. Install Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from: https://ollama.com/download/windows

# Download the AI model (one-time, ~4.9GB)
ollama pull llama3.1:8b
```

#### 2. Setup Python Virtual Environment
```bash
cd quiksnap-study-tool

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows
```

#### 3. Install Python Dependencies
```bash
pip3 install easyocr pillow flask flask-cors
```

#### 4. Install Node Dependencies
```bash
npm install
```

#### 5. macOS: Grant Screen Recording Permission
- Go to: **System Settings → Privacy & Security → Screen Recording**
- Enable **Terminal** (required!)
- Enable **Electron** (if it appears)
- Restart the app after granting permission

### Running the Electron App

**Terminal 1 - OCR Service:**
```bash
cd quiksnap-study-tool
source venv/bin/activate
python3 ocr-service/ocr_server.py
```

**Terminal 2 - Electron App:**
```bash
cd quiksnap-study-tool
npm start
```

### Usage (Electron)
1. Click **"Start Recording"**
2. Select screen/window to capture
3. Study normally - screenshots captured every 20 seconds
4. Click **"Stop Recording"**
5. Click **"Generate Notes"**
6. **(Optional)** Click **"Generate Quiz"**
7. Copy and save your notes!

---

## Browser Version (Chrome - With Audio!)

### Why Use Browser Version?

Chrome can capture **tab audio natively** - perfect for transcribing lectures from YouTube, Coursera, etc!

### Running Browser Version

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

Or manually navigate to: **http://localhost:8080** (use `index-browser.html`)

### Usage (Browser - WITH AUDIO)

1. **Open your lecture** in a separate Chrome tab (YouTube, etc.)
2. Go to QuikSnap tab (localhost:8080)
3. Click **"Start Recording"**
4. **Important:** Select the **Chrome Tab** with your lecture
5. **Check "Share audio"** ✅
6. Click **Share**
7. Audio gets transcribed automatically! 🎤
8. Stop recording when done
9. Generate notes (combines audio + screenshots!)
10. Generate quiz

**Audio Tip:** The QuikSnap tab is automatically muted to prevent feedback loops!

---

## Features

- ✅ **Free forever** (no API costs)
- ✅ **Privacy-first** (runs completely locally)
- ✅ **Smart deduplication** (skips identical screens)
- ✅ **Real-time capture** (see live previews)
- ✅ **Adjustable intervals** (5-60 seconds)
- ✅ **AI-generated notes** (comprehensive summaries)
- ✅ **Quiz generation** (custom practice questions)
- ✅ **Audio transcription** (browser version only)

---

## File Structure

```
quiksnap-study-tool/
├── index.html              # Electron app UI
├── index-browser.html      # Browser version UI  
├── main.js                 # Electron main process
├── renderer.js             # Electron renderer (no audio)
├── renderer-browser.js     # Browser renderer (with audio)
├── server.js               # Web server for browser version
├── ocr-service/
│   └── ocr_server.py      # OCR service
├── package.json
├── venv/                   # Python virtual environment
└── README.md
```

---

## Troubleshooting

### Electron App Issues

**"Could not start video source"**
- Grant Screen Recording permission in System Settings
- Enable **Terminal** specifically
- Restart the app completely

**"No text extracted"**
- OCR service must be running
- Check: `curl http://localhost:5001/health`
- Verify venv is activated

### Browser Version Issues

**"No audio transcribed"**
- Did you select **Chrome Tab** (not entire screen)?
- Did you check **"Share audio"**?
- Is audio actually playing in the selected tab?

**Buttons unresponsive**
- Check browser console for errors (F12)
- Make sure `renderer-browser.js` exists
- Hard refresh: Cmd+Shift+R

### General Issues

**Ollama not responding**
- Check: `ollama list`
- If needed: `ollama serve`

**Services not starting**
- Verify all 3 prerequisites are installed
- Check Python version: `python3 --version`
- Check Node version: `node --version`

---

## Comparison

| Feature | Electron App | Browser Version |
|---------|--------------|-----------------|
| **Screenshots** | ✅ Yes | ✅ Yes |
| **OCR** | ✅ Yes | ✅ Yes |
| **AI Notes** | ✅ Yes | ✅ Yes |
| **Quiz** | ✅ Yes | ✅ Yes |
| **Audio Transcription** | ❌ No | ✅ Yes (Chrome tabs!) |
| **Setup** | Simple | Simple |
| **Best For** | Docs, slides | Video lectures |

---

## Tips for Best Results

- 📚 **Electron app** is great for reading, documents, code
- 🎥 **Browser version** is perfect for video lectures with audio
- ⏱️ Use **20-second intervals** for most study sessions
- 💾 OCR is very accurate for text-based content
- 🎤 Audio transcription works with any Chrome tab playing audio

---

## Cost Comparison

| This App | Cloud Alternatives |
|----------|-------------------|
| **$0 forever** | $20-45 per 3-hour session |
| Unlimited sessions | Pay per use |
| Complete privacy | Data sent to cloud |
| Runs offline | Requires internet |

---

## Support

- **Check services**: 
  - OCR: `curl http://localhost:5001/health`
  - Ollama: `ollama list`
  - Web server: Check terminal for "Server Running!" message

- **Logs**: View terminal windows for debugging

---

**Enjoy your AI study assistant!** 🎓✨

Choose the version that fits your study needs:
- 📖 Reading/docs → **Electron app**
- 🎬 Video lectures → **Browser version**

## Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python 3.8+** - [Download here](https://python.org/)
- **Ollama** - Local AI model runner

## Installation

### 1. Install Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows - download from: https://ollama.com/download/windows

# Download the AI model (one-time, ~4.9GB)
ollama pull llama3.1:8b

# Verify installation
ollama list
```

**Note:** Ollama runs automatically in the background after installation. You don't need to manually start it.

### 2. Setup Python Virtual Environment
```bash
cd study-recorder

# Create virtual environment
python3 -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Python Dependencies
```bash
# Make sure venv is activated (you should see "(venv)" in your prompt)
pip install easyocr pillow flask flask-cors
```

### 4. Install Node Dependencies
```bash
npm install
```

### 5. macOS Users: Grant Screen Recording Permission

When you first try to record, macOS will ask for permission:

1. Go to **System Settings → Privacy & Security → Screen Recording**
2. You need to enable **BOTH**:
   - ✅ **Terminal** (this is critical - the app runs through Terminal)
   - ✅ **Electron** (may also appear in the list)
3. **Important:** Toggle them ON, then **completely quit and restart the app**
4. If you still get permission errors, try restarting your Mac

**Note:** The app won't work without Terminal having Screen Recording permission, since you're running it via `npm start` from Terminal.

### 6. Audio Transcription (Optional)

**Two ways to use audio transcription:**

#### Option A: Microphone Transcription (Simple - Works Now!)
- ✅ QuikSnap will request **microphone permission**
- ✅ Speak while studying to add your own notes/explanations
- ✅ Great for: Recording your thoughts, explanations, summaries
- ❌ Won't capture system audio (YouTube, lectures playing)

**To use:**
- Just click "Start Recording"
- Allow microphone when prompted
- Choose "Audio Only" or "Both" mode
- Speak your notes while studying!

#### Option B: System Audio (Advanced - Requires Setup)
To capture audio from videos/lectures playing on your computer:

1. Install **BlackHole** virtual audio device:
   ```bash
   brew install blackhole-2ch
   ```

2. Configure macOS Audio MIDI Setup:
   - Open "Audio MIDI Setup" app
   - Create "Multi-Output Device" with:
     - Built-in Output (so you can hear)
     - BlackHole 2ch (for app to capture)
   - Set as system output
   - Restart QuikSnap

3. Now system audio will be transcribed!

**Recommendation:** 
- **Microphone mode** is perfect for active studying (explain concepts aloud!)
- **Visual mode** (screenshots + OCR) works great for passive learning
- **System audio** only if you really need video lecture transcription

## Running the App

You need **2 terminals** running simultaneously:

### Terminal 1 - OCR Service (keep this open!)
```bash
cd study-recorder
source venv/bin/activate  # or venv\Scripts\activate on Windows
python ocr-service/ocr_server.py
```

You should see:
```
Loading OCR model...
OCR ready!
 * Running on http://127.0.0.1:5001
```

**Keep this terminal open while using the app!**

### Terminal 2 - Electron App
```bash
cd study-recorder
npm start
```

## Features

- ✅ **Free forever** (no API costs)
- ✅ **Privacy-first** (runs completely locally)
- ✅ **Smart deduplication** (skips identical screens)
- ✅ **Real-time capture** (see live previews)
- ✅ **Adjustable intervals** (5-60 seconds)
- ✅ **Beautiful UI** (with live stats)
- ✅ **AI-generated notes** (comprehensive study summaries)
- ✅ **Quiz generation** (custom practice questions from your content)
- ✅ **Copy to clipboard** (export notes & quizzes easily)

## Usage

1. Make sure both services are running (2 terminals)
2. Click **"Start Recording"** in QuikSnap
3. Select screen or window to capture
4. Choose recording mode:
   - **Smart (Auto)**: Optimizes capture automatically
   - **Visual Only**: Screenshots + OCR (recommended - works for everything!)
   - **Audio Only**: Transcription (requires BlackHole setup)
   - **Both**: Combined mode (requires BlackHole setup)
5. Study as normal - QuikSnap captures automatically
6. Click **"Stop Recording"** when finished
7. Click **"Generate Notes"** to process with AI
8. Review your notes and **copy them!**
9. **(Optional)** Generate quiz questions for practice

**Note:** Audio transcription requires additional setup on macOS. Visual mode (screenshots + OCR) works great for most study scenarios!

## Troubleshooting

### "No text extracted" error
- ✅ Make sure OCR service is running in Terminal 1
- ✅ Verify venv is activated: `source venv/bin/activate`
- ✅ Check service is responding: `curl http://localhost:5001/health`

### "Could not start video source" error
- ✅ Grant Screen Recording permission in System Settings
- ✅ Completely quit and restart the app (Cmd+Q or Ctrl+C)

### "Error generating notes" error
- ✅ Verify Ollama is running: `ollama list`
- ✅ If needed, start Ollama: `ollama serve`

### Port 5000 already in use (macOS)
The app uses port **5001** to avoid conflicts with Apple's ControlCenter (which uses 5000).

## Customization

Edit these values in the app:
- **Capture Interval**: Adjust screenshot frequency (5-60 seconds)
- **Quiz Questions**: Choose 5-50 questions
- **Quiz Difficulty**: Easy, Medium, Hard, or Mixed
- **AI Model**: Change `llama3.1:8b` to other Ollama models in `renderer.js`

## Quiz Feature

After generating notes, you can create custom quiz questions:
- **Adjustable quantity**: Generate 5-50 questions
- **Difficulty levels**: Easy, Medium, Hard, or Mixed
- **Question types**: Multiple choice, True/False, Short answer
- **Includes answers & explanations**: Learn from correct answers
- **Copy & export**: Use in Quizlet, Anki, or print for study

Example quiz format:
```
Q1: What is the primary function of mitochondria?
A) Protein synthesis
B) Energy production through ATP
C) DNA replication
D) Cell division
Correct Answer: B
Explanation: Mitochondria are the powerhouse of the cell...
```

## Tips for Best Results

- 📚 **Visual mode is excellent** - OCR captures text from slides, documents, code perfectly
- 🎥 Works great for **video lectures** - captures key frames automatically
- ⏱️ Use **Smart mode** for automatic optimization
- 💾 Text extraction is **highly accurate** and works for all content
- 🔊 **Audio transcription** requires BlackHole setup (optional, advanced)
- ✨ **Combine with manual notes** - QuikSnap captures what you miss!

## Cost Comparison

| This App | Cloud Alternatives |
|----------|-------------------|
| **$0 forever** | $20-45 per 3-hour session |
| Unlimited sessions | Pay per use |
| Complete privacy | Data sent to cloud |
| Runs offline | Requires internet |

## Support

- Check if Ollama is running: `ollama list`
- Check if OCR service is running: `curl http://localhost:5001/health`
- View logs in the terminal windows for debugging

---

**Enjoy your AI study assistant!** 🎓✨

For questions or issues, check that both services are running and permissions are granted.