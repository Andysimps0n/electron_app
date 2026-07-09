import { useCalendarEvents } from '../../hooks/useCalendarEvents'
import {
  DAY_LABELS,
  getMonthGrid,
  isSameDay,
  isSameMonth,
} from '../../utils/dateUtils'
import {
  formatSelectionRange,
  getDateKey,
  getEventColorStyle,
} from './calendarUtils'

export default function MonthView({
  viewedMonth,
  selectedDate,
  today,
  onDateSelect,
}) {
  const { events } = useCalendarEvents()
  const cells = getMonthGrid(
    viewedMonth.getFullYear(),
    viewedMonth.getMonth(),
  )

  return (
    <div className="month-view">
      <div className="month-view-grid">
        {DAY_LABELS.map((label) => (
          <div key={label} className="month-view-day-header">
            {label}
          </div>
        ))}

        {cells.map((date) => {
          const inMonth = isSameMonth(date, viewedMonth)
          const isToday = isSameDay(date, today)
          const isSelected = isSameDay(date, selectedDate)
          const dayEvents = events.filter(
            (event) => event.dateKey === getDateKey(date),
          )

          return (
            <button
              key={date.toISOString()}
              type="button"
              className={[
                'month-view-cell',
                !inMonth && 'month-view-cell-outside',
                isToday && 'month-view-cell-today',
                isSelected && !isToday && 'month-view-cell-selected',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onDateSelect(date)}
            >
              <span
                className={`month-view-date-num${
                  isToday ? ' month-view-date-today' : ''
                }`}
              >
                {String(date.getDate()).padStart(2, '0')}
              </span>

              <div className="month-view-events">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="month-view-event"
                    style={getEventColorStyle(event.color)}
                  >
                    <span className="month-view-event-text">
                      {event.title} | {formatSelectionRange(event)}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
