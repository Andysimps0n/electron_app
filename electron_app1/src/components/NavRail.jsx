import {
  CalendarIcon,
  NoteIcon,
  SettingsIcon,
} from './icons'

const NAV_ITEMS = [
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
  { id: 'notes', label: 'Notes', Icon: NoteIcon },
]

export default function NavRail({
  activeView,
  onViewChange,
  onOpenSettings,
}) {
  return (
    <div className="nav-rail-shell">
      <div className="nav-rail-shell__clip">
        <nav className="nav-rail" aria-label="Main navigation">
          <div className="nav-rail__items">
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={`nav-rail__item${activeView === id ? ' nav-rail__item--active' : ''}`}
                aria-label={label}
                aria-current={activeView === id ? 'page' : undefined}
                onClick={() => onViewChange(id)}
              >
                <Icon />
              </button>
            ))}
          </div>

          <button
            type="button"
            className="nav-rail__item"
            aria-label="Settings"
            onClick={onOpenSettings}
          >
            <SettingsIcon />
          </button>
        </nav>
      </div>
    </div>
  )
}
