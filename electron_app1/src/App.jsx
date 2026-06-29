import { useState } from 'react'
import Calendar from './components/Calendar'
import NavRail from './components/NavRail'
import Notes from './components/Notes'

const VIEW_TITLES = {
  calendar: 'Calendar',
  notes: 'Notes',
}

function formatHeaderDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function App() {
  const [activeView, setActiveView] = useState('calendar')
  const [navRailOpen, setNavRailOpen] = useState(true)

  return (
    <div className="app">
      <div className="app-body">
        <NavRail
          activeView={activeView}
          onViewChange={setActiveView}
          navRailOpen={navRailOpen}
          onToggleNavRail={() => setNavRailOpen((open) => !open)}
        />
        {activeView === 'calendar' && <Calendar />}
        {activeView === 'notes' && <Notes />}
      </div>
    </div>
  )
}

export default App
