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
 * know that, for example, Calendar needs `settingsOpen`. Panel also injects
 * `defaultSidebarOpen` (false in split layout, true when a single panel fills
 * the screen).
 */
import Calendar from '../features/calendar/Calendar'
import Music from '../features/music/Music'
import Notes from '../features/notes/Notes'
import Timer from '../features/timer/Timer'
import { CalendarIcon, MusicIcon, NoteIcon, TimerIcon } from '../shared/icons'

export const VIEW_REGISTRY = {
  timer: {
    id: 'timer',
    title: '타이머',
    Icon: TimerIcon,
    render: (context) => (
      <Timer defaultSidebarOpen={context.defaultSidebarOpen} />
    ),
  },
  calendar: {
    id: 'calendar',
    title: '캘린더',
    Icon: CalendarIcon,
    render: (context) => (
      <Calendar
        settingsOpen={context.settingsOpen}
        onSettingsOpenChange={context.onSettingsOpenChange}
        defaultSidebarOpen={context.defaultSidebarOpen}
      />
    ),
  },
  notes: {
    id: 'notes',
    title: '노트',
    Icon: NoteIcon,
    render: (context) => (
      <Notes defaultSidebarOpen={context.defaultSidebarOpen} />
    ),
  },
  music: {
    id: 'music',
    title: '음악',
    Icon: MusicIcon,
    render: () => <Music />,
  },
}

// Ordered list, used to build the sidebar and the EmptyPanel placeholder so
// they always stay in sync with what's registered.
export const VIEW_LIST = [
  VIEW_REGISTRY.timer,
  VIEW_REGISTRY.calendar,
  VIEW_REGISTRY.notes,
  VIEW_REGISTRY.music,
]

// Returns null for unknown types (e.g. the 'empty' placeholder).
export function getView(viewType) {
  return VIEW_REGISTRY[viewType] ?? null
}
