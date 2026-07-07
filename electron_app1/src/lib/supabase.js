import { createClient } from '@supabase/supabase-js'

// Single shared client for the whole renderer. PKCE is the OAuth flow that
// works both in the browser (redirect back to the app) and in Electron
// (exchangeCodeForSession after the loopback server catches the redirect).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: 'pkce',
    },
  },
)
