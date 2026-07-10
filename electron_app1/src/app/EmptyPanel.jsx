import { VIEW_LIST } from '../utils/viewRegistry'

/**
 * Placeholder shown inside a panel that has no view assigned yet.
 * Each button assigns its view to *this* panel via onPickView.
 * The button list is derived from the view registry, so registering a new
 * page type automatically adds a button here.
 */
export default function EmptyPanel({ onPickView }) {
  return (
    <div className="empty-panel">
      <p className="empty-panel-title">화면 열기</p>
      <div className="empty-panel-actions">
        {VIEW_LIST.map((view) => (
          <button
            key={view.id}
            type="button"
            className="empty-panel-btn"
            onClick={() => onPickView(view.id)}
          >
            <view.Icon width={16} height={16} />
            <span>{view.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
