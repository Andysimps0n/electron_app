function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <rect
        x="2"
        y="4"
        width="16"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M2 8H18" stroke="currentColor" strokeWidth="2" />
      <path d="M6 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M5 2h8l4 4v12H5V2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M13 2v4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 10h6M7 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const NAV_ITEMS = [
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
  { id: 'notes', label: 'Notes', Icon: NoteIcon },
]

export default function NavRail({ activeView, onViewChange }) {
  return (
    <nav className="nav-rail" aria-label="Main navigation">
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
  )
}
