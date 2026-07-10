import { ChevronLeftIcon, ChevronRightIcon, PanelIcon } from '../../shared/icons'
import TodoList from '../../shared/TodoList'
import {
  DAY_LABELS,
  formatMonthYear,
  getMonthGrid,
  isSameDay,
  isSameMonth,
} from '../../utils/dateUtils'

export default function CalendarSidebar({
  viewedMonth,
  selectedDate,
  today,
  eventDates,
  sidebarOpen,
  onDateSelect,
  onPreviousMonth,
  onNextMonth,
  onToggleSidebar,
}) {
  const cells = getMonthGrid(viewedMonth.getFullYear(), viewedMonth.getMonth())

  return (
    <aside className="sidebar">
      <div className="sidebar-month">
        <div className="sidebar-header">
          <div className="sidebar-header-month">
            <button
              type="button"
              className="sidebar-nav-btn"
              aria-label="이전 달"
              onClick={onPreviousMonth}
            >
              <ChevronLeftIcon />
            </button>
            <h2 className="sidebar-title">{formatMonthYear(viewedMonth)}</h2>
            <button
              type="button"
              className="sidebar-nav-btn"
              aria-label="다음 달"
              onClick={onNextMonth}
            >
              <ChevronRightIcon />
            </button>
          </div>
          {/* <button
            type="button"
            className="sidebar-panel-toggle"
            aria-label={sidebarOpen ? '사이드바 숨기기' : '사이드바 보이기'}
            aria-pressed={sidebarOpen}
            onClick={onToggleSidebar}
          >
            <PanelIcon />
          </button> */}
        </div>

        <div className="sidebar-grid">
          {DAY_LABELS.map((label) => (
            <span key={label} className="sidebar-day-label">
              {label.charAt(0)}
            </span>
          ))}

          {cells.map((date) => {
            const inMonth = isSameMonth(date, viewedMonth)
            const isToday = isSameDay(date, today)
            const isSelected = isSameDay(date, selectedDate)
            const hasEvent = eventDates.some((eventDate) =>
              isSameDay(eventDate, date),
            )

            return (
              <button
                key={date.toISOString()}
                type="button"
                className={[
                  'sidebar-date',
                  !inMonth && 'sidebar-date-outside',
                  isToday && 'sidebar-date-today',
                  isSelected && !isToday && 'sidebar-date-selected',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onDateSelect(date)}
              >
                <span className="sidebar-date-num">{date.getDate()}</span>
                {hasEvent && <span className="sidebar-event-dot" />}
              </button>
            )
          })}
        </div>
      </div>

      <TodoList
        title="할 일 목록"
        placeholder="할 일 추가...   (Enter로 추가)"
      />
    </aside>
  )
}
