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
        aria-label={sidebarOpen ? '사이드바 숨기기' : '사이드바 보이기'}
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
          aria-label={`현재 시각 ${digitalClock.hours}:${digitalClock.minutes} ${digitalClock.period}`}
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

        <div className="view-toggle" role="group" aria-label="캘린더 보기">
          <button
            type="button"
            className={`view-toggle-btn${view === 'month' ? ' view-toggle-btn-active' : ''}`}
            aria-pressed={view === 'month'}
            onClick={() => onViewChange('month')}
          >
            월
          </button>
          <button
            type="button"
            className={`view-toggle-btn${view === 'week' ? ' view-toggle-btn-active' : ''}`}
            aria-pressed={view === 'week'}
            onClick={() => onViewChange('week')}
          >
            주
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
