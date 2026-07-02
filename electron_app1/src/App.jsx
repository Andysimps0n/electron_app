import { useEffect, useState } from 'react'
import NavRail from './components/NavRail'
import SplitView from './components/SplitView'
import {
  canSplit,
  closePanel,
  createInitialState,
  getActiveView,
  openOrFocusView,
  setActivePanel,
  setPanelView,
  splitView,
} from './utils/splitView'

function App() {
  // The whole split-view layout lives in one state object. App is the single
  // owner of that state; every child just receives data + callbacks.
  const [split, setSplit] = useState(() => createInitialState('calendar'))
  const [settingsOpen, setSettingsOpen] = useState(false)

  const activeView = getActiveView(split)
  const splitEnabled = canSplit(split)

  // Sidebar: focus an existing panel for this view, or open it in the active panel.
  function handleOpenView(view) {
    setSplit((prev) => openOrFocusView(prev, view))
  }

  function handleSplit() {
    setSplit((prev) => splitView(prev))
  }

  function handleFocusPanel(panelId) {
    setSplit((prev) => setActivePanel(prev, panelId))
  }

  function handleAssignView(panelId, view) {
    setSplit((prev) => setPanelView(prev, panelId, view))
  }

  function handleClosePanel(panelId) {
    setSplit((prev) => closePanel(prev, panelId))
  }

  // Keyboard shortcut: Cmd/Ctrl + \ splits the view (VS Code parity).
  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === '\\') {
        event.preventDefault()
        setSplit((prev) => (canSplit(prev) ? splitView(prev) : prev))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Shared props that some views need. The registry decides which views use
  // which fields, so the panel components stay unaware of these details.
  const viewContext = {
    settingsOpen,
    onSettingsOpenChange: setSettingsOpen,
  }

  return (
    <div className="app">
      <div className="app-body">
        <NavRail
          activeView={activeView}
          onViewChange={handleOpenView}
          onSplitView={handleSplit}
          canSplit={splitEnabled}
          onOpenSettings={() => {
            handleOpenView('calendar')
            setSettingsOpen(true)
          }}
        />
        <SplitView
          panels={split.panels}
          activePanelId={split.activePanelId}
          onFocusPanel={handleFocusPanel}
          onAssignView={handleAssignView}
          onClosePanel={handleClosePanel}
          viewContext={viewContext}
        />
      </div>
    </div>
  )
}

export default App
