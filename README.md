# QuikSnap Study Tool

A free desktop app that records your screen and generates AI-powered study notes and quizzes.

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
2. Click **"Start Recording"** in the app
3. Study as normal - the app captures your screen automatically every 20 seconds (or your set interval)
4. Click **"Stop Recording"** when finished
5. Click **"Generate Notes"** to process with AI
6. Review your notes and **copy them!**
7. **(Optional)** Adjust quiz settings and click **"Generate Quiz"** for practice questions
8. Copy quiz questions to use in your study tools (Quizlet, Anki, etc.)

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

- 📚 Works best with **text-heavy content** (slides, documents, code)
- 🎥 Captures **key frames** from video lectures automatically
- ⏱️ Use **20-30 second intervals** for most study sessions
- 💾 Text extraction saves **95% on processing costs** vs pure image analysis

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