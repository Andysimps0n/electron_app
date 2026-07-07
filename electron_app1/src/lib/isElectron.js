// The Electron preload script exposes window.electronAPI via contextBridge.
// If it's missing, we're running as a plain web app (Vite dev in a browser).
export function isElectron() {
  return typeof window !== 'undefined' && Boolean(window.electronAPI)
}
