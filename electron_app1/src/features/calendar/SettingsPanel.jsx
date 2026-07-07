import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

function AccountSection() {
  const { user, isLoading, signInWithGoogle, signOut } = useAuth()
  const [authError, setAuthError] = useState(null)
  const [isBusy, setIsBusy] = useState(false)

  async function handleAuthAction(action) {
    setAuthError(null)
    setIsBusy(true)
    try {
      await action()
    } catch (error) {
      setAuthError(error.message ?? 'Something went wrong. Please try again.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <section className="settings-panel-section">
      <h3 className="settings-panel-section-title">Account</h3>
      <div className="settings-panel-option settings-panel-account">
        {user ? (
          <>
            <span className="settings-panel-option-label">{user.email}</span>
            <span className="settings-panel-option-hint">
              Signed in — presets sync across devices
            </span>
            <button
              type="button"
              className="settings-panel-auth-btn"
              disabled={isBusy}
              onClick={() => handleAuthAction(signOut)}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <span className="settings-panel-option-label">Not signed in</span>
            <span className="settings-panel-option-hint">
              Sign in to sync your music presets across devices
            </span>
            <button
              type="button"
              className="settings-panel-auth-btn"
              disabled={isBusy || isLoading}
              onClick={() => handleAuthAction(signInWithGoogle)}
            >
              Sign in with Google
            </button>
          </>
        )}
      </div>
      {authError && (
        <p className="settings-panel-auth-error" role="alert">
          {authError}
        </p>
      )}
    </section>
  )
}

export default function SettingsPanel({ reverseScroll, onReverseScrollChange, onClose }) {
  return (
    <div className="settings-panel" role="dialog" aria-modal="true" aria-label="Settings">
      <button
        type="button"
        className="settings-panel-backdrop"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div className="settings-panel-sheet">
        <header className="settings-panel-header">
          <h2 className="settings-panel-title">Settings</h2>
          <button
            type="button"
            className="settings-panel-close"
            aria-label="Close settings"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <AccountSection />

        <section className="settings-panel-section">
          <h3 className="settings-panel-section-title">Calendar</h3>
          <label className="settings-panel-option">
            <span className="settings-panel-option-label">
              Reverse horizontal scroll
            </span>
            <span className="settings-panel-option-hint">
              {reverseScroll
                ? 'Swipe left to go to the previous week'
                : 'Swipe left to go to the next week'}
            </span>
            <input
              type="checkbox"
              checked={reverseScroll}
              onChange={(event) => onReverseScrollChange(event.target.checked)}
            />
          </label>
        </section>
      </div>
    </div>
  )
}
