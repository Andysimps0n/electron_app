import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './authButton.css'

function getUserAvatarUrl(user) {
  return user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? ''
}

function getUserInitial(user) {
  const name = user?.user_metadata?.full_name ?? user?.email ?? 'User'
  return name.trim().charAt(0).toUpperCase() || 'U'
}

function LoginCard({ isBusy, error, onClose, onSignIn }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="login-card-layer" role="presentation">
      <button
        type="button"
        className="login-card-backdrop"
        aria-label="Close login dialog"
        onClick={onClose}
      />

      <section
        className="login-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-card-title"
      >
        <button
          type="button"
          className="login-card-close"
          aria-label="Close login dialog"
          onClick={onClose}
        >
          ×
        </button>

        <div className="login-card-mark" aria-hidden="true">
          G
        </div>
        <h2 id="login-card-title" className="login-card-title">
          Sign in to sync
        </h2>
        <p className="login-card-copy">
          Continue with Google to keep your workspace connected across devices.
        </p>

        <button
          type="button"
          className="login-card-google-btn"
          disabled={isBusy}
          onClick={onSignIn}
        >
          {isBusy ? 'Signing in...' : 'Continue with Google'}
        </button>

        {error && (
          <p className="login-card-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  )
}

export default function AuthButton() {
  const { user, isLoading, signInWithGoogle, signOut } = useAuth()
  const [isLoginCardOpen, setIsLoginCardOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [authError, setAuthError] = useState(null)
  const avatarUrl = getUserAvatarUrl(user)

  useEffect(() => {
    if (user) {
      setIsLoginCardOpen(false)
      setAuthError(null)
    }
  }, [user])

  async function handleSignIn() {
    setAuthError(null)
    setIsBusy(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      setAuthError(error.message ?? 'Could not sign in. Please try again.')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleSignOut() {
    setAuthError(null)
    setIsBusy(true)
    try {
      await signOut()
    } catch (error) {
      setAuthError(error.message ?? 'Could not sign out. Please try again.')
      setIsLoginCardOpen(true)
    } finally {
      setIsBusy(false)
    }
  }

  if (user) {
    return (
      <>
        <button
          type="button"
          className="auth-button auth-button-avatar"
          aria-label={`Sign out ${user.email ?? 'current user'}`}
          title={user.email ?? 'Signed in'}
          disabled={isBusy}
          onClick={handleSignOut}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="auth-button-image" />
          ) : (
            <span className="auth-button-initial">{getUserInitial(user)}</span>
          )}
        </button>

        {isLoginCardOpen && authError && (
          <LoginCard
            isBusy={isBusy}
            error={authError}
            onClose={() => setIsLoginCardOpen(false)}
            onSignIn={handleSignIn}
          />
        )}
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        className="auth-button"
        disabled={isLoading || isBusy}
        onClick={() => {
          setAuthError(null)
          setIsLoginCardOpen(true)
        }}
      >
        Login
      </button>

      {isLoginCardOpen && (
        <LoginCard
          isBusy={isBusy}
          error={authError}
          onClose={() => setIsLoginCardOpen(false)}
          onSignIn={handleSignIn}
        />
      )}
    </>
  )
}
