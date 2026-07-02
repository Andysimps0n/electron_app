/**
 * View registry.
 *
 * This is the single place that maps a view type (a string like 'timer') to
 * everything the UI needs to display it: a human title, an icon, and a render
 * function. The split-view components (SplitView / Panel / EmptyPanel) never
 * import Timer/Calendar/Notes directly, so they stay generic. To add a new page
 * type in the future, you register it here and nothing else needs to change.
 *
 * `render(context)` receives a small context object so a view can pull only the
 * shared props it cares about. This keeps the panel components from having to
 * know that, for example, Calendar needs `settingsOpen`.
 */
import Calendar from '../components/Calendar'
import Notes from '../components/Notes'
import Timer from '../components/Timer'
import { CalendarIcon, NoteIcon, TimerIcon } from '../components/icons'

export const VIEW_REGISTRY = {
  timer: {
    id: 'timer',
    title: 'Timer',
    Icon: TimerIcon,
    render: () => <Timer />,
  },
  calendar: {
    id: 'calendar',
    title: 'Calendar',
    Icon: CalendarIcon,
    render: (context) => (
      <Calendar
        settingsOpen={context.settingsOpen}
        onSettingsOpenChange={context.onSettingsOpenChange}
      />
    ),
  },
  notes: {
    id: 'notes',
    title: 'Notes',
    Icon: NoteIcon,
    render: () => <Notes />,
  },
}

// Ordered list, used to build the sidebar and the EmptyPanel placeholder so
// they always stay in sync with what's registered.
export const VIEW_LIST = [
  VIEW_REGISTRY.timer,
  VIEW_REGISTRY.calendar,
  VIEW_REGISTRY.notes,
]

// Returns null for unknown types (e.g. the 'empty' placeholder).
export function getView(viewType) {
  return VIEW_REGISTRY[viewType] ?? null
}
