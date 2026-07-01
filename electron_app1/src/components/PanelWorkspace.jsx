import { useState } from 'react'
import Calendar from './Calendar'
import Notes from './Notes'
import Timer from './Timer'
import { CalendarIcon, NoteIcon, TimerIcon } from './icons'
import {
  findPaneById,
  moveTab,
  removeTab,
  setActiveTab,
  splitPane,
} from '../utils/panelLayout'

const TAB_ICONS = {
  calendar: CalendarIcon,
  notes: NoteIcon,
  timer: TimerIcon,
}

function parseDragPayload(event) {
  const raw = event.dataTransfer.getData('application/x-panel-tab')
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function TabBar({
  pane,
  isFocused,
  dropTarget,
  onSelectTab,
  onCloseTab,
  onFocusPane,
  onSplitPane,
  onDropTab,
  onDragOverTab,
  onDragLeaveTab,
}) {
  function handleDragStart(event, tab) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(
      'application/x-panel-tab',
      JSON.stringify({ tabId: tab.id, sourcePaneId: pane.id }),
    )
    event.currentTarget.classList.add('panel-tab-dragging')
  }

  function handleDragEnd(event) {
    event.currentTarget.classList.remove('panel-tab-dragging')
    onDragLeaveTab()
  }

  function handleBarDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    onDragOverTab(pane.id, pane.tabs.length)
  }

  function handleBarDrop(event) {
    event.preventDefault()
    const payload = parseDragPayload(event)
    if (!payload) {
      return
    }

    onDropTab(payload, pane.id, pane.tabs.length)
  }

  return (
    <div
      className={`panel-pane-tab-bar${
        isFocused ? ' panel-pane-tab-bar-focused' : ''
      }${dropTarget?.paneId === pane.id ? ' panel-pane-tab-bar-drop-target' : ''}`}
      onMouseDown={onFocusPane}
      onDragOver={handleBarDragOver}
      onDrop={handleBarDrop}
    >
      <div className="panel-pane-tabs">
        {pane.tabs.map((tab, index) => {
          const Icon = TAB_ICONS[tab.viewType]
          const isActive = tab.id === pane.activeTabId
          const isDropBefore =
            dropTarget?.paneId === pane.id && dropTarget.index === index

          return (
            <div key={tab.id} className="panel-tab-wrap">
              {isDropBefore && <span className="panel-tab-drop-indicator" />}
              <div
                role="tab"
                tabIndex={0}
                aria-selected={isActive}
                draggable
                className={`panel-tab${isActive ? ' panel-tab-active' : ''}`}
                onClick={() => onSelectTab(tab.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectTab(tab.id)
                  }
                }}
                onDragStart={(event) => handleDragStart(event, tab)}
                onDragEnd={handleDragEnd}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  const rect = event.currentTarget.getBoundingClientRect()
                  const insertIndex =
                    event.clientX < rect.left + rect.width / 2 ? index : index + 1
                  onDragOverTab(pane.id, insertIndex)
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  const payload = parseDragPayload(event)
                  if (!payload) {
                    return
                  }

                  const rect = event.currentTarget.getBoundingClientRect()
                  const insertIndex =
                    event.clientX < rect.left + rect.width / 2 ? index : index + 1
                  onDropTab(payload, pane.id, insertIndex)
                }}
              >
                {Icon && <Icon width={14} height={14} />}
                <span className="panel-tab-label">{tab.title}</span>
                <button
                  type="button"
                  className="panel-tab-close"
                  aria-label={`Close ${tab.title}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    onCloseTab(tab.id)
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )
        })}
        {dropTarget?.paneId === pane.id &&
          dropTarget.index === pane.tabs.length && (
            <span className="panel-tab-drop-indicator panel-tab-drop-indicator-end" />
          )}
      </div>
    </div>
  )
}

function PanelPane({
  pane,
  layout,
  isFocused,
  dropTarget,
  settingsOpen,
  onSettingsOpenChange,
  onLayoutChange,
  onFocusPane,
  onDropTab,
  onDragOverTab,
  onDragLeaveTab,
}) {
  return (
    <div
      className={`panel-pane${isFocused ? ' panel-pane-focused' : ''}`}
      onMouseDown={onFocusPane}
    >
      <TabBar
        pane={pane}
        isFocused={isFocused}
        dropTarget={dropTarget}
        onSelectTab={(tabId) => {
          onFocusPane()
          onLayoutChange(setActiveTab(layout, pane.id, tabId))
        }}
        onCloseTab={(tabId) => {
          onLayoutChange(removeTab(layout, tabId))
        }}
        onFocusPane={onFocusPane}
        onSplitPane={(direction) => {
          onLayoutChange(splitPane(layout, pane.id, direction))
        }}
        onDropTab={onDropTab}
        onDragOverTab={onDragOverTab}
        onDragLeaveTab={onDragLeaveTab}
      />

      <div className="panel-pane-content">
        {pane.tabs.length === 0 ? (
          <div className="panel-pane-empty">
            <p>Drop a tab here or open Calendar / Notes / Timer from the sidebar.</p>
          </div>
        ) : (
          pane.tabs.map((tab) => (
            <div
              key={tab.id}
              className="panel-pane-view"
              hidden={tab.id !== pane.activeTabId}
            >
              {tab.viewType === 'calendar' && (
                <Calendar
                  settingsOpen={settingsOpen}
                  onSettingsOpenChange={onSettingsOpenChange}
                />
              )}
              {tab.viewType === 'notes' && <Notes />}
              {tab.viewType === 'timer' && <Timer />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function LayoutNode({
  layout,
  node,
  focusedPaneId,
  dropTarget,
  settingsOpen,
  onSettingsOpenChange,
  onLayoutChange,
  onFocusedPaneChange,
  onDropTab,
  onDragOverTab,
  onDragLeaveTab,
}) {
  if (node.type === 'pane') {
    const isFocused = node.id === focusedPaneId

    return (
      <PanelPane
        pane={node}
        layout={layout}
        isFocused={isFocused}
        dropTarget={dropTarget}
        settingsOpen={settingsOpen}
        onSettingsOpenChange={onSettingsOpenChange}
        onLayoutChange={onLayoutChange}
        onFocusPane={() => onFocusedPaneChange(node.id)}
        onDropTab={onDropTab}
        onDragOverTab={onDragOverTab}
        onDragLeaveTab={onDragLeaveTab}
      />
    )
  }

  const ratio = node.ratio ?? 0.5

  return (
    <div className={`panel-split panel-split--${node.direction}`}>
      <div
        className="panel-split-child"
        style={
          node.direction === 'horizontal'
            ? { flexBasis: `${ratio * 100}%` }
            : { flexBasis: `${ratio * 100}%` }
        }
      >
        <LayoutNode
          node={node.first}
          layout={layout}
          focusedPaneId={focusedPaneId}
          dropTarget={dropTarget}
          settingsOpen={settingsOpen}
          onSettingsOpenChange={onSettingsOpenChange}
          onLayoutChange={onLayoutChange}
          onFocusedPaneChange={onFocusedPaneChange}
          onDropTab={onDropTab}
          onDragOverTab={onDragOverTab}
          onDragLeaveTab={onDragLeaveTab}
        />
      </div>
      <div className="panel-split-divider" aria-hidden="true" />
      <div className="panel-split-child panel-split-child-second">
        <LayoutNode
          node={node.second}
          layout={layout}
          focusedPaneId={focusedPaneId}
          dropTarget={dropTarget}
          settingsOpen={settingsOpen}
          onSettingsOpenChange={onSettingsOpenChange}
          onLayoutChange={onLayoutChange}
          onFocusedPaneChange={onFocusedPaneChange}
          onDropTab={onDropTab}
          onDragOverTab={onDragOverTab}
          onDragLeaveTab={onDragLeaveTab}
        />
      </div>
    </div>
  )
}

export default function PanelWorkspace({
  layout,
  onLayoutChange,
  focusedPaneId,
  onFocusedPaneChange,
  settingsOpen,
  onSettingsOpenChange,
}) {
  const [dropTarget, setDropTarget] = useState(null)

  function handleDropTab(payload, targetPaneId, insertIndex) {
    setDropTarget(null)

    if (!payload?.tabId) {
      return
    }

    let nextLayout = moveTab(layout, payload.tabId, targetPaneId, insertIndex)
    onLayoutChange(nextLayout)
    onFocusedPaneChange(targetPaneId)
  }

  function handleDragOverTab(paneId, index) {
    setDropTarget({ paneId, index })
  }

  function handleDragLeaveTab() {
    setDropTarget(null)
  }

  return (
    <div
      className="panel-workspace"
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) {
          return
        }
        setDropTarget(null)
      }}
    >
      <LayoutNode
        node={layout}
        layout={layout}
        focusedPaneId={focusedPaneId}
        dropTarget={dropTarget}
        settingsOpen={settingsOpen}
        onSettingsOpenChange={onSettingsOpenChange}
        onLayoutChange={onLayoutChange}
        onFocusedPaneChange={onFocusedPaneChange}
        onDropTab={handleDropTab}
        onDragOverTab={handleDragOverTab}
        onDragLeaveTab={handleDragLeaveTab}
      />
    </div>
  )
}