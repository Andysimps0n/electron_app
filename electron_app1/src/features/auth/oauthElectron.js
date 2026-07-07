import { supabase } from '../../lib/supabase'

export const LOOPBACK_REDIRECT_URL = 'http://127.0.0.1:54321/callback'

/**
 * Electron sign-in: we can't do a full-page redirect inside the app window,
 * so instead we:
 *   1. Ask Supabase for the Google OAuth URL without navigating to it.
 *   2. Hand that URL to the main process, which opens the system browser
 *      and runs a localhost loopback server to catch the redirect.
 *   3. Exchange the auth code the loopback caught for a real session.
 */
export async function signInWithGoogleElectron() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: LOOPBACK_REDIRECT_URL,
      skipBrowserRedirect: true,
    },
  })

  if (error) {
    throw error
  }

  const code = await window.electronAPI.signInWithGoogle(data.url)

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    throw exchangeError
  }
}
