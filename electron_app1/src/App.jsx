import { useState } from 'react'
import NavRail from './components/NavRail'
import PanelWorkspace from './components/PanelWorkspace'
import {
  createInitialLayout,
  getFocusedViewType,
  openOrFocusView,
} from './utils/panelLayout'

function App() {
  const [layout, setLayout] = useState(createInitialLayout)
  const [focusedPaneId, setFocusedPaneId] = useState('pane-root')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const activeView = getFocusedViewType(layout, focusedPaneId)

  function handleOpenView(viewType) {
    const result = openOrFocusView(layout, viewType, focusedPaneId)
    setLayout(result.layout)
    setFocusedPaneId(result.focusedPaneId)
  }

  return (
    <div className="app">
      <div className="app-body">
        <NavRail
          activeView={activeView}
          onViewChange={handleOpenView}
          onOpenSettings={() => {
            handleOpenView('calendar')
            setSettingsOpen(true)
          }}
        />
        <PanelWorkspace
          layout={layout}
          onLayoutChange={setLayout}
          focusedPaneId={focusedPaneId}
          onFocusedPaneChange={setFocusedPaneId}
          settingsOpen={settingsOpen}
          onSettingsOpenChange={setSettingsOpen}
        />
      </div>
    </div>
  )
}

export default App
