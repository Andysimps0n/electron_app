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
      setAuthError(error.message ?? '문제가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <section className="settings-panel-section">
      <h3 className="settings-panel-section-title">계정</h3>
      <div className="settings-panel-option settings-panel-account">
        {user ? (
          <>
            <span className="settings-panel-option-label">{user.email}</span>
            <span className="settings-panel-option-hint">
              로그인됨 — 프리셋이 기기 간에 동기화됩니다
            </span>
            <button
              type="button"
              className="settings-panel-auth-btn"
              disabled={isBusy}
              onClick={() => handleAuthAction(signOut)}
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <span className="settings-panel-option-label">로그인되지 않음</span>
            <span className="settings-panel-option-hint">
              로그인하여 음악 프리셋을 여러 기기에서 동기화하세요
            </span>
            <button
              type="button"
              className="settings-panel-auth-btn"
              disabled={isBusy || isLoading}
              onClick={() => handleAuthAction(signInWithGoogle)}
            >
              Google로 로그인
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
    <div className="settings-panel" role="dialog" aria-modal="true" aria-label="설정">
      <button
        type="button"
        className="settings-panel-backdrop"
        aria-label="설정 닫기"
        onClick={onClose}
      />
      <div className="settings-panel-sheet">
        <header className="settings-panel-header">
          <h2 className="settings-panel-title">설정</h2>
          <button
            type="button"
            className="settings-panel-close"
            aria-label="설정 닫기"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <AccountSection />

        <section className="settings-panel-section">
          <h3 className="settings-panel-section-title">캘린더</h3>
          <label className="settings-panel-option">
            <span className="settings-panel-option-label">
              가로 스크롤 방향 반전
            </span>
            <span className="settings-panel-option-hint">
              {reverseScroll
                ? '왼쪽으로 스와이프하면 이전 주로 이동합니다'
                : '왼쪽으로 스와이프하면 다음 주로 이동합니다'}
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
