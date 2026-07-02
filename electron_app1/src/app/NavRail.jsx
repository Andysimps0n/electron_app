import {
  CalendarIcon,
  MusicIcon,
  NoteIcon,
  PanelIcon,
  SettingsIcon,
  TimerIcon,
} from '../shared/icons'

const NAV_ITEMS = [
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
  { id: 'notes', label: 'Notes', Icon: NoteIcon },
  { id: 'timer', label: 'Timer', Icon: TimerIcon },
  { id: 'music', label: 'Music', Icon: MusicIcon },
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
        <nav className="nav-rail" aria-label="Main navigation">
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
              aria-label="Split view"
              title="Split view (Cmd/Ctrl + \)"
              disabled={!canSplit}
              onClick={onSplitView}
            >
              <PanelIcon />
            </button>

            <button
              type="button"
              className="nav-rail-item"
              aria-label="Settings"
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
