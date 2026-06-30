export const VIEW_META = {
  calendar: { id: 'calendar', title: 'Calendar' },
  notes: { id: 'notes', title: 'Notes' },
}

export function createTab(viewType) {
  return {
    id: crypto.randomUUID(),
    viewType,
    title: VIEW_META[viewType].title,
  }
}

export function createPane(id, tabs = [], activeTabId = null) {
  return { type: 'pane', id, tabs, activeTabId }
}

export function createSplit(id, direction, first, second, ratio = 0.5) {
  return { type: 'split', id, direction, first, second, ratio }
}

export function createInitialLayout() {
  const tab = createTab('calendar')
  return createPane('pane-root', [tab], tab.id)
}

function mapNode(node, visitor) {
  const next = visitor(node)
  if (!next || next.type !== 'split') {
    return next
  }

  return {
    ...next,
    first: mapNode(next.first, visitor),
    second: mapNode(next.second, visitor),
  }
}

export function findPaneById(layout, paneId) {
  if (layout.type === 'pane') {
    return layout.id === paneId ? layout : null
  }

  return findPaneById(layout.first, paneId) ?? findPaneById(layout.second, paneId)
}

export function findTabLocation(layout, tabId, parent = null) {
  if (layout.type === 'pane') {
    const index = layout.tabs.findIndex((tab) => tab.id === tabId)
    if (index === -1) {
      return null
    }

    return {
      paneId: layout.id,
      pane: layout,
      tab: layout.tabs[index],
      index,
    }
  }

  return (
    findTabLocation(layout.first, tabId, layout) ??
    findTabLocation(layout.second, tabId, layout)
  )
}

export function findTabByViewType(layout, viewType) {
  if (layout.type === 'pane') {
    const tab = layout.tabs.find((entry) => entry.viewType === viewType)
    if (!tab) {
      return null
    }

    return { paneId: layout.id, tabId: tab.id, tab }
  }

  return (
    findTabByViewType(layout.first, viewType) ??
    findTabByViewType(layout.second, viewType)
  )
}

export function getFocusedViewType(layout, focusedPaneId) {
  const pane = findPaneById(layout, focusedPaneId)
  if (!pane?.activeTabId) {
    return null
  }

  const tab = pane.tabs.find((entry) => entry.id === pane.activeTabId)
  return tab?.viewType ?? null
}

export function updatePane(layout, paneId, updater) {
  return mapNode(layout, (node) => {
    if (node.type !== 'pane' || node.id !== paneId) {
      return node
    }

    return updater(node)
  })
}

export function setActiveTab(layout, paneId, tabId) {
  return updatePane(layout, paneId, (pane) => ({
    ...pane,
    activeTabId: tabId,
  }))
}

export function addTabToPane(layout, paneId, tab) {
  return updatePane(layout, paneId, (pane) => ({
    ...pane,
    tabs: [...pane.tabs, tab],
    activeTabId: tab.id,
  }))
}

export function removeTab(layout, tabId) {
  const location = findTabLocation(layout, tabId)
  if (!location) {
    return layout
  }

  return updatePane(layout, location.paneId, (pane) => {
    const nextTabs = pane.tabs.filter((tab) => tab.id !== tabId)
    let nextActiveTabId = pane.activeTabId

    if (pane.activeTabId === tabId) {
      const closedIndex = location.index
      const fallback = nextTabs[closedIndex] ?? nextTabs[closedIndex - 1] ?? null
      nextActiveTabId = fallback?.id ?? null
    }

    return {
      ...pane,
      tabs: nextTabs,
      activeTabId: nextActiveTabId,
    }
  })
}

export function moveTab(layout, tabId, targetPaneId, insertIndex = null) {
  const source = findTabLocation(layout, tabId)
  if (!source) {
    return layout
  }

  const samePane = source.paneId === targetPaneId
  let adjustedIndex = insertIndex

  if (insertIndex != null && samePane && insertIndex > source.index) {
    adjustedIndex = insertIndex - 1
  }

  let nextLayout = removeTab(layout, tabId)

  nextLayout = updatePane(nextLayout, targetPaneId, (pane) => {
    const index =
      adjustedIndex == null
        ? pane.tabs.length
        : clamp(adjustedIndex, 0, pane.tabs.length)

    const nextTabs = [...pane.tabs]
    nextTabs.splice(index, 0, source.tab)

    return {
      ...pane,
      tabs: nextTabs,
      activeTabId: source.tab.id,
    }
  })

  return nextLayout
}

export function splitPane(layout, paneId, direction) {
  return mapNode(layout, (node) => {
    if (node.type !== 'pane' || node.id !== paneId) {
      return node
    }

    const emptyPane = createPane(`pane-${crypto.randomUUID()}`, [], null)

    return createSplit(
      `split-${crypto.randomUUID()}`,
      direction,
      node,
      emptyPane,
      0.5,
    )
  })
}

export function findFirstPane(layout) {
  if (layout.type === 'pane') {
    return layout
  }

  return findFirstPane(layout.first) ?? findFirstPane(layout.second)
}

export function openOrFocusView(layout, viewType, focusedPaneId) {
  const existing = findTabByViewType(layout, viewType)
  if (existing) {
    return {
      layout: setActiveTab(layout, existing.paneId, existing.tabId),
      focusedPaneId: existing.paneId,
    }
  }

  const tab = createTab(viewType)
  const targetPane =
    findPaneById(layout, focusedPaneId) ?? findFirstPane(layout)

  if (!targetPane) {
    return { layout, focusedPaneId }
  }

  return {
    layout: addTabToPane(layout, targetPane.id, tab),
    focusedPaneId: targetPane.id,
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}
