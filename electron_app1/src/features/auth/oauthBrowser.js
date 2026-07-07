import { supabase } from '../../lib/supabase'

/**
 * Browser sign-in: full-page redirect to Google, then back to this app.
 * Supabase's client picks up the auth code from the URL when we return.
 */
export async function signInWithGoogleBrowser() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })

  if (error) {
    throw error
  }
}
