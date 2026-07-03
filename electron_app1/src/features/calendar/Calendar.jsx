import { useEffect, useState } from 'react'
import CalendarSidebar from './CalendarSidebar'
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

  function handleWeekChange(date) {
    setSelectedDate(date)
    if (!isSameMonth(date, viewedMonth)) {
      setViewedMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    }
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
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />
      </aside>
      <WeekView
        selectedDate={selectedDate}
        today={today}
        view={view}
        sidebarOpen={sidebarOpen}
        reverseScroll={reverseScroll}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onViewChange={setView}
        onWeekChange={handleWeekChange}
      />
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
