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

  // Open http(s) links in the system browser (AI suggestion chips, etc.).
  // Reject anything that is not http/https so a compromised renderer cannot
  // open local files or custom protocols.
  ipcMain.handle('shell:open-external', async (_event, url) => {
    if (typeof url !== 'string') {
      throw new Error('openExternal requires a string URL')
    }
    let parsed
    try {
      parsed = new URL(url)
    } catch {
      throw new Error('openExternal received an invalid URL')
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('openExternal only allows http(s) URLs')
    }
    await shell.openExternal(parsed.toString())
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
