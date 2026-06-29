import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, NoteIcon } from './icons'

const NAV_ITEMS = [
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
  { id: 'notes', label: 'Notes', Icon: NoteIcon },
]

export default function NavRail({
  activeView,
  onViewChange,
  navRailOpen,
  onToggleNavRail,
}) {
  return (
    <div
      className={`nav-rail-shell${navRailOpen ? ' nav-rail-shell--open' : ''}`}
    >
      <div className="nav-rail-shell__clip">
        <nav
          className="nav-rail"
          aria-label="Main navigation"
          aria-hidden={!navRailOpen}
        >
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
              <span className="nav-rail__label">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <button
        type="button"
        className={`nav-rail__toggle${
          navRailOpen ? ' nav-rail__toggle--open' : ''
        }`}
        aria-label={navRailOpen ? 'Close navigation' : 'Open navigation'}
        aria-pressed={navRailOpen}
        aria-expanded={navRailOpen}
        onClick={onToggleNavRail}
      >
        {navRailOpen ? (
          <ChevronLeftIcon width={12} height={12} />
        ) : (
          <ChevronRightIcon width={12} height={12} />
        )}
      </button>
    </div>
  )
}
