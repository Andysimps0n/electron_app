import { Fragment } from 'react'
import Panel from './Panel'

/**
 * Lays panels out side by side with a divider between each pair.
 *
 * The layout is a simple flex row where every panel has `flex: 1`, so panels
 * always share the width evenly (50/50 for two). When a panel is closed, the
 * survivors automatically expand to fill the space with no extra logic.
 *
 * The divider is rendered as its own element between panels. That's the seam
 * where a future draggable-resize handle can be attached without touching the
 * panels themselves.
 */
export default function SplitView({
  panels,
  activePanelId,
  onFocusPanel,
  onAssignView,
  onClosePanel,
  viewContext,
}) {
  // A panel only gets a header/close button once there's more than one panel.
  const showChrome = panels.length > 1

  return (
    <div className={`split-view${showChrome ? ' split-view-multi' : ''}`}>
      {panels.map((panel, index) => (
        <Fragment key={panel.id}>
          {index > 0 && <div className="split-divider" aria-hidden="true" />}
          <Panel
            panel={panel}
            isActive={showChrome && panel.id === activePanelId}
            showChrome={showChrome}
            onFocus={() => onFocusPanel(panel.id)}
            onAssignView={(view) => onAssignView(panel.id, view)}
            onClose={() => onClosePanel(panel.id)}
            viewContext={viewContext}
          />
        </Fragment>
      ))}
    </div>
  )
}
