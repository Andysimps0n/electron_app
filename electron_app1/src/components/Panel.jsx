import EmptyPanel from './EmptyPanel'
import { getView } from '../utils/viewRegistry'

/**
 * A single panel. It knows how to:
 *   - render its assigned view (looked up in the registry) or the EmptyPanel
 *   - become active when clicked (onFocus)
 *   - show a header with a close button when the layout is split
 *
 * The panel is deliberately generic: it never references Timer/Calendar/Notes
 * by name. It just asks the registry to render whatever `panel.view` is.
 *
 * `showChrome` is true only when more than one panel exists. When there's a
 * single panel we render the view full-bleed (no header), so the common,
 * unsplit case looks exactly like before.
 */
export default function Panel({
  panel,
  isActive,
  showChrome,
  onFocus,
  onAssignView,
  onClose,
  viewContext,
}) {
  const view = getView(panel.view)

  return (
    <section
      className={`split-panel${isActive ? ' split-panel-active' : ''}`}
      onMouseDown={onFocus}
      aria-label={view ? view.title : 'Empty panel'}
    >
      {showChrome && (
        <header className="split-panel-header">
          <span className="split-panel-title">
            {view && <view.Icon width={14} height={14} />}
            <span>{view ? view.title : 'Empty'}</span>
          </span>
          <button
            type="button"
            className="split-panel-close"
            aria-label="Close panel"
            onClick={(event) => {
              event.stopPropagation()
              onClose()
            }}
          >
            ×
          </button>
        </header>
      )}

      <div className="split-panel-body">
        {view ? (
          view.render(viewContext)
        ) : (
          <EmptyPanel onPickView={onAssignView} />
        )}
      </div>
    </section>
  )
}
