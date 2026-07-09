import { useEffect, useState } from 'react'
import { PanelIcon } from '../../shared/icons'
import AuthButton from '../../shared/AuthButton'
import MusicMuteButton from '../../shared/MusicMuteButton'
import { formatMonthYearShort } from '../../utils/dateUtils'
import { formatDigitalClock } from './calendarUtils'

export default function CalendarHeader({
  view,
  selectedDate,
  viewedMonth,
  sidebarOpen,
  onToggleSidebar,
  onViewChange,
}) {
  const [now, setNow] = useState(() => new Date())
  const digitalClock = formatDigitalClock(now)
  const titleDate = view === 'month' ? viewedMonth : selectedDate

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <header className="calendar-header">
      <button
        type="button"
        className="sidebar-panel-toggle"
        aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        aria-pressed={sidebarOpen}
        onClick={onToggleSidebar}
      >
        <PanelIcon />
      </button>

      <div className="calendar-header-center">
        <div className="calendar-header-title-group">
          <h1 className="calendar-header-title">
            {formatMonthYearShort(titleDate)}
          </h1>
        </div>
        <time
          className="calendar-header-clock"
          dateTime={now.toISOString()}
          aria-label={`Current time ${digitalClock.hours}:${digitalClock.minutes} ${digitalClock.period}`}
        >
          <span className="calendar-header-clock-digit">{digitalClock.hours}</span>
          <span className="calendar-header-clock-separator" aria-hidden="true">
            :
          </span>
          <span className="calendar-header-clock-digit">
            {digitalClock.minutes}
          </span>
          <span className="calendar-header-clock-period">{digitalClock.period}</span>
        </time>

        <div className="view-toggle" role="group" aria-label="Calendar view">
          <button
            type="button"
            className={`view-toggle-btn${view === 'month' ? ' view-toggle-btn-active' : ''}`}
            aria-pressed={view === 'month'}
            onClick={() => onViewChange('month')}
          >
            MONTH
          </button>
          <button
            type="button"
            className={`view-toggle-btn${view === 'week' ? ' view-toggle-btn-active' : ''}`}
            aria-pressed={view === 'week'}
            onClick={() => onViewChange('week')}
          >
            WEEK
          </button>
        </div>
      </div>

      <div className="calendar-header-actions">
        <MusicMuteButton />
        <AuthButton />
      </div>
    </header>
  )
}
