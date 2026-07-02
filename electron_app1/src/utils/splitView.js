/**
 * Split-view state model.
 *
 * This module owns the *shape* and *rules* of the split-view layout, with no
 * React and no knowledge of Timer/Calendar/Notes. Keeping it as a set of pure
 * functions means the logic is easy to read, test, and reuse, and the UI
 * components stay dumb (they just render state and call these helpers).
 *
 * State shape:
 *   {
 *     panels: [ { id: string, view: 'timer'|'calendar'|'notes'|'empty' }, ... ],
 *     activePanelId: string,   // which panel the sidebar navigation targets
 *   }
 *
 * We model `panels` as an array (not a hard-coded "left/right") so that
 * supporting more than two panels later is just a matter of raising MAX_PANELS.
 */

// The value a panel holds before the user has chosen a view for it.
export const EMPTY_VIEW = 'empty'

// How many panels can exist at once. Two for now (VS Code-style side-by-side),
// but the model does not otherwise assume "two", so this is the only knob to
// turn when we want to allow more panels.
export const MAX_PANELS = 2

export function createPanel(view = EMPTY_VIEW) {
  return {
    id: crypto.randomUUID(),
    view,
  }
}

export function createInitialState(view = 'calendar') {
  const panel = createPanel(view)
  return {
    panels: [panel],
    activePanelId: panel.id,
  }
}

// Can we add another panel right now?
export function canSplit(state) {
  return state.panels.length < MAX_PANELS
}

/**
 * Split: append a new empty panel and focus it.
 * Existing panels (and their views) are left untouched, satisfying
 * "the currently open page remains in the original panel".
 */
export function splitView(state) {
  if (!canSplit(state)) {
    return state
  }

  const newPanel = createPanel(EMPTY_VIEW)
  return {
    panels: [...state.panels, newPanel],
    activePanelId: newPanel.id,
  }
}

export function setActivePanel(state, panelId) {
  if (state.activePanelId === panelId) {
    return state
  }

  return {
    ...state,
    activePanelId: panelId,
  }
}

// Small helper: return new state with one panel replaced by updater(panel).
function updatePanel(state, panelId, updater) {
  return {
    ...state,
    panels: state.panels.map((panel) =>
      panel.id === panelId ? updater(panel) : panel,
    ),
  }
}

/**
 * Assign a view to a specific panel (used by the EmptyPanel buttons and by
 * sidebar navigation). Assigning also focuses that panel, which matches the
 * intuition that "the panel you just changed is the one you're working in".
 */
export function setPanelView(state, panelId, view) {
  const next = updatePanel(state, panelId, (panel) => ({ ...panel, view }))
  return setActivePanel(next, panelId)
}

// Sidebar navigation: change whatever the currently active panel is showing.
export function setActivePanelView(state, view) {
  return setPanelView(state, state.activePanelId, view)
}

// Returns the first panel already showing this view, or null.
export function findPanelByView(state, view) {
  return state.panels.find((panel) => panel.view === view) ?? null
}

/**
 * Sidebar navigation with focus-first behavior:
 *   - if any panel already shows this view → focus that panel (leave others unchanged)
 *   - otherwise → assign the view to the currently active panel
 */
export function openOrFocusView(state, view) {
  const existing = findPanelByView(state, view)
  if (existing) {
    return setActivePanel(state, existing.id)
  }

  return setActivePanelView(state, view)
}

/**
 * Close a panel. The last remaining panel can never be closed. If the closed
 * panel was active, focus moves to a surviving panel (which keeps its view and
 * expands to fill the space automatically via CSS flex).
 */
export function closePanel(state, panelId) {
  if (state.panels.length <= 1) {
    return state
  }

  const remaining = state.panels.filter((panel) => panel.id !== panelId)
  const activePanelId =
    state.activePanelId === panelId
      ? remaining[remaining.length - 1].id
      : state.activePanelId

  return {
    panels: remaining,
    activePanelId,
  }
}

// Which view is the active panel showing? Used to highlight the sidebar.
export function getActiveView(state) {
  const panel = state.panels.find((entry) => entry.id === state.activePanelId)
  return panel ? panel.view : null
}
