import TodoList from '../../shared/TodoList'

const POMODORO_PRESETS = [
  { id: '25-5', label: '25 / 5', focusSeconds: 25 * 60, breakSeconds: 5 * 60 },
  { id: '45-5', label: '45 / 5', focusSeconds: 45 * 60, breakSeconds: 5 * 60 },
  { id: '50-10', label: '50 / 10', focusSeconds: 50 * 60, breakSeconds: 10 * 60 },
]

export default function TimerSidebar({
  activeMode,
  activePresetId,
  onSelectFocus,
  onSelectClock,
}) {
  return (
    <aside className="sidebar timer-sidebar">
      <div className="timer-sidebar-modes">
        <section className="timer-sidebar-section">
          <h2 className="sidebar-title timer-sidebar-section-title">Focus</h2>
          <ul className="timer-sidebar-list">
            {POMODORO_PRESETS.map((preset) => (
              <li key={preset.id}>
                <button
                  type="button"
                  className={`timer-sidebar-item${
                    activeMode === 'focus' && activePresetId === preset.id
                      ? ' timer-sidebar-item-active'
                      : ''
                  }`}
                  onClick={() => onSelectFocus(preset)}
                >
                  <span className="timer-sidebar-item-label">{preset.label}</span>
                  <span className="timer-sidebar-item-meta">focus / break</span>
                </button>
              </li>
            ))}
              <button
                type="button"
                className={`timer-sidebar-item${
                  activeMode === 'clock' ? ' timer-sidebar-item-active' : ''
                }`}
                onClick={onSelectClock}
              >
                <span className="timer-sidebar-item-label">Desk Clock</span>
                <span className="timer-sidebar-item-meta">Digital clock</span>
              </button>
          </ul>
        </section>

      </div>

      <TodoList
        title="Tasks"
        placeholder="Add a task...   (Enter to add)"
      />
    </aside>
  )
}
