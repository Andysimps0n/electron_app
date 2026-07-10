import { useEffect, useState } from 'react'
import CalendarHeader from './CalendarHeader'
import CalendarSidebar from './CalendarSidebar'
import MonthView from './MonthView'
import SettingsPanel from './SettingsPanel'
import WeekView from './WeekView'
import { getMockEventDates, loadReverseScrollSetting } from './calendarUtils'
import { isSameMonth } from '../../utils/dateUtils'
import '../../shared/sidebar.css'
import './calendar.css'

export default function Calendar({
  settingsOpen,
  onSettingsOpenChange,
  defaultSidebarOpen = true,
}) {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today)
  const [viewedMonth, setViewedMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [view, setView] = useState('week')
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen)
  const [reverseScroll, setReverseScroll] = useState(loadReverseScrollSetting)

  const settingsVisible = settingsOpen ?? false
  const setSettingsVisible = onSettingsOpenChange ?? (() => {})

  useEffect(() => {
    localStorage.setItem('reverseScroll', String(reverseScroll))
  }, [reverseScroll])

  function handleDateSelect(date) {
    setSelectedDate(date)
    if (!isSameMonth(date, viewedMonth)) {
      setViewedMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }

  // Month grid click: select that day, then jump to its week.
  // WeekView already derives the visible week from selectedDate.
  function handleMonthDateSelect(date) {
    handleDateSelect(date)
    setView('week')
  }

  function handleWeekChange(date) {
    setSelectedDate(date)
    if (!isSameMonth(date, viewedMonth)) {
      setViewedMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }

  function handleViewChange(nextView) {
    setView(nextView)
    if (nextView === 'month' && !isSameMonth(selectedDate, viewedMonth)) {
      setViewedMonth(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      )
    }
  }

  function handlePreviousMonth() {
    setViewedMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    )
  }

  function handleNextMonth() {
    setViewedMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    )
  }

  return (
    <div className="calendar">
      <aside
        className={`month-sidebar${sidebarOpen ? ' month-sidebar-open' : ''}`}
        aria-hidden={!sidebarOpen}
      >
        <CalendarSidebar
          viewedMonth={viewedMonth}
          selectedDate={selectedDate}
          today={today}
          eventDates={getMockEventDates(viewedMonth)}
          sidebarOpen={sidebarOpen}
          onDateSelect={handleDateSelect}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />
      </aside>
      <div className="calendar-main">
        <CalendarHeader
          view={view}
          selectedDate={selectedDate}
          viewedMonth={viewedMonth}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onViewChange={handleViewChange}
        />
        {view === 'week' ? (
          <WeekView
            selectedDate={selectedDate}
            today={today}
            reverseScroll={reverseScroll}
            onWeekChange={handleWeekChange}
          />
        ) : (
          <MonthView
            viewedMonth={viewedMonth}
            selectedDate={selectedDate}
            today={today}
            onDateSelect={handleMonthDateSelect}
          />
        )}
      </div>
      {settingsVisible && (
        <SettingsPanel
          reverseScroll={reverseScroll}
          onReverseScrollChange={setReverseScroll}
          onClose={() => setSettingsVisible(false)}
        />
      )}
    </div>
  )
}
