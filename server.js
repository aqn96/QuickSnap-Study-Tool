const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Remove query string
    let filePath = '.' + req.url.split('?')[0];
    if (filePath === './') {
        filePath = './index-browser.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`
🚀 QuikSnap Study Tool Server Running!

📍 Open in Chrome: http://localhost:${PORT}

✅ Make sure OCR service is also running:
   Terminal 1: python3 ocr-service/ocr_server.py
   Terminal 2: node server.js (this server)
   Terminal 3: Chrome browser

🎤 To capture lecture audio:
   1. Open lecture in Chrome tab
   2. Start recording in QuikSnap
   3. Select the Chrome tab with lecture
   4. Check "Share audio" ✅
   5. Audio will be transcribed!

Press Ctrl+C to stop server
`);
});