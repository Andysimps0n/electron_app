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
