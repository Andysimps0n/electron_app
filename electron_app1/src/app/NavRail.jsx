import {
  CalendarIcon,
  MusicIcon,
  NoteIcon,
  PanelIcon,
  SettingsIcon,
  TimerIcon,
} from '../shared/icons'

const NAV_ITEMS = [
  { id: 'calendar', label: '캘린더', Icon: CalendarIcon },
  { id: 'notes', label: '노트', Icon: NoteIcon },
  { id: 'timer', label: '타이머', Icon: TimerIcon },
  { id: 'music', label: '음악', Icon: MusicIcon },
]

export default function NavRail({
  activeView,
  onViewChange,
  onSplitView,
  canSplit,
  onOpenSettings,
}) {
  return (
    <div className="nav-rail-shell">
      <div className="nav-rail-shell-clip">
        <nav className="nav-rail" aria-label="메인 탐색">
          <div className="nav-rail-items">
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={`nav-rail-item${activeView === id ? ' nav-rail-item-active' : ''}`}
                aria-label={label}
                aria-current={activeView === id ? 'page' : undefined}
                onClick={() => onViewChange(id)}
              >
                <Icon />
              </button>
            ))}
          </div>

          <div className="nav-rail-items">
            <button
              type="button"
              className="nav-rail-item"
              aria-label="화면 분할"
              title="화면 분할 (Cmd/Ctrl + \)"
              disabled={!canSplit}
              onClick={onSplitView}
            >
              <PanelIcon />
            </button>

            <button
              type="button"
              className="nav-rail-item"
              aria-label="설정"
              onClick={onOpenSettings}
            >
              <SettingsIcon />
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
