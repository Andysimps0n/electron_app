import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isElectron } from '../lib/isElectron'
import { signInWithGoogleBrowser } from '../features/auth/oauthBrowser'
import { signInWithGoogleElectron } from '../features/auth/oauthElectron'
import { syncPresetOnLogin } from '../features/sync/musicPresetSync'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)

      const shouldSync =
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
        nextSession?.user

      if (shouldSync) {
        // Deferred: supabase-js warns against calling its own methods
        // synchronously inside this callback (can deadlock its auth lock).
        const userId = nextSession.user.id
        setTimeout(() => {
          syncPresetOnLogin(userId).catch((error) => {
            console.error('Failed to sync music preset:', error)
          })
        }, 0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    if (isElectron()) {
      await signInWithGoogleElectron()
    } else {
      await signInWithGoogleBrowser()
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }

  const value = {
    session,
    user: session?.user ?? null,
    isLoading,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
