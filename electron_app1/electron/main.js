import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { waitForOAuthCallback } from './oauthLoopback.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    win.loadURL(DEV_SERVER_URL)
  }
}

app.whenReady().then(() => {
  // The renderer sends the Supabase OAuth URL; we open it in the user's real
  // browser (they trust it, it has their Google session) and wait for the
  // loopback server to catch the redirect with the auth code.
  ipcMain.handle('auth:sign-in-with-google', async (_event, oauthUrl) => {
    const callbackPromise = waitForOAuthCallback()
    await shell.openExternal(oauthUrl)
    return callbackPromise
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
