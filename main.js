const { app, BrowserWindow, desktopCapturer, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // Setup display media request handler for audio capture
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
      // Grant access to the first source found with audio loopback
      if (sources.length > 0) {
        callback({ 
          video: sources[0],
          audio: 'loopback'  // This enables system audio capture!
        });
      } else {
        callback({});
      }
    }).catch(err => {
      console.error('Error getting sources:', err);
      callback({});
    });
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools for debugging (optional)
  // mainWindow.webContents.openDevTools();
}

// Handle screen capture source request (fallback)
ipcMain.handle('get-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    return sources;
  } catch (error) {
    console.error('Error getting sources:', error);
    return [];
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});