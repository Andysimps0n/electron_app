// Runs in the renderer before the app loads, with access to Node APIs.
// contextBridge is the only safe way to hand capabilities to page scripts.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Takes the Supabase OAuth URL, opens the system browser, and resolves
  // with the auth code once the loopback server catches the redirect.
  signInWithGoogle: (oauthUrl) =>
    ipcRenderer.invoke('auth:sign-in-with-google', oauthUrl),

  // Open an http(s) URL in the user's default browser (e.g. Coupang search).
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
})
