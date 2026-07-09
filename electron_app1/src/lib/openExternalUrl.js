import { isElectron } from './isElectron'

/**
 * Open a URL in the user's real browser.
 * In Electron we use shell.openExternal via IPC (more reliable than window.open).
 * In a plain browser tab we fall back to window.open.
 */
export async function openExternalUrl(url) {
  if (isElectron() && typeof window.electronAPI?.openExternal === 'function') {
    await window.electronAPI.openExternal(url)
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}
