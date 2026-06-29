import { useState } from 'react'
import Calendar from './components/Calendar/Calendar'
import NavRail from './components/NavRail/NavRail'
import Notes from './components/Notes/Notes'

function App() {
  const [activeView, setActiveView] = useState('calendar')

  return (
    <div className="app">
      <NavRail activeView={activeView} onViewChange={setActiveView} />
      {activeView === 'calendar' && <Calendar />}
      {activeView === 'notes' && <Notes />}
    </div>
  )
}

export default App
