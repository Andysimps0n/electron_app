export const START_HOUR = 0
export const END_HOUR = 24
export const CELL_HEIGHT = 64
export const SNAP_MINUTES = 30
export const HORIZONTAL_SCROLL_DOMINANCE = 1.35
export const HORIZONTAL_SCROLL_LOCK_MS = 220
export const WEEK_OFFSETS = [-1, 0, 1]
// Event colors follow the Toss semantic palette (DESIGN.md §2):
// warning orange, premium purple, blue500, success green. Each color has a
// solid (left bar / swatch), a muted tint (block fill), and a stronger tint
// (selected/editing fill).
export const EVENT_COLORS = {
  orange: {
    label: '주황',
    solid: 'rgb(254, 152, 0)',
    muted: 'rgba(254, 152, 0, 0.12)',
    light: 'rgba(254, 152, 0, 0.3)',
  },
  purple: {
    label: '보라',
    solid: 'rgb(162, 52, 199)',
    muted: 'rgba(162, 52, 199, 0.1)',
    light: 'rgba(162, 52, 199, 0.25)',
  },
  blue: {
    label: '파랑',
    solid: 'rgb(49, 130, 246)',
    muted: 'rgba(49, 130, 246, 0.1)',
    light: 'rgba(49, 130, 246, 0.25)',
  },
  green: {
    label: '초록',
    solid: 'rgb(3, 178, 108)',
    muted: 'rgba(3, 178, 108, 0.1)',
    light: 'rgba(3, 178, 108, 0.25)',
  },
}
export const EVENT_COLOR_KEYS = Object.keys(EVENT_COLORS)
export const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => i + START_HOUR,
)

export function loadReverseScrollSetting() {
  const stored = localStorage.getItem('reverseScroll')
  return stored === null ? true : stored === 'true'
}

export function getMockEventDates(referenceDate) {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  return [2, 5, 9, 12, 18, 25].map((day) => new Date(year, month, day))
}

export function formatMinutes(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const period = hour >= 12 ? '오후' : '오전'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${period} ${displayHour}:${String(minute).padStart(2, '0')}`
}

export { formatDigitalClock } from '../../shared/timeUtils'

export function formatSelectionRange(selection) {
  return `${formatMinutes(selection.startMinute)} - ${formatMinutes(
    selection.endMinute,
  )}`
}

export function getDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

/** How far ahead repeating events are materialised as separate instances. */
export const REPEAT_HORIZON_DAYS = 12 * 7

/**
 * Builds the list of dates for a repeating event, including the start date.
 * Used when saving: we create one stored event per occurrence (simple model).
 */
export function getRepeatOccurrenceDates(
  startDate,
  { repeat = 'none', interval = 1, unit = 'day' } = {},
) {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  if (repeat === 'none' || !repeat) {
    return [start]
  }

  let stepDays
  if (repeat === 'daily') {
    stepDays = 1
  } else if (repeat === 'weekly') {
    stepDays = 7
  } else if (repeat === 'custom') {
    const safeInterval = Math.max(1, Number(interval) || 1)
    stepDays = unit === 'week' ? safeInterval * 7 : safeInterval
  } else {
    return [start]
  }

  const dates = [start]
  const end = new Date(start)
  end.setDate(end.getDate() + REPEAT_HORIZON_DAYS)

  let cursor = new Date(start)
  cursor.setDate(cursor.getDate() + stepDays)

  while (cursor.getTime() <= end.getTime()) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + stepDays)
  }

  return dates
}

export function getEventColorStyle(colorKey) {
  const color = EVENT_COLORS[colorKey]
  if (!color) {
    return {}
  }

  return {
    '--event-bg': color.muted,
    '--event-border': color.solid,
    '--event-bg-editing': color.light,
  }
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function resizeSelection(selection, edge, minute) {
  if (edge === 'start') {
    return {
      ...selection,
      startMinute: clamp(
        Math.min(minute, selection.endMinute - SNAP_MINUTES),
        START_HOUR * 60,
        selection.endMinute - SNAP_MINUTES,
      ),
    }
  }

  return {
    ...selection,
    endMinute: clamp(
      Math.max(minute, selection.startMinute + SNAP_MINUTES),
      selection.startMinute + SNAP_MINUTES,
      END_HOUR * 60,
    ),
  }
}

export function moveTimeBlock(block, dayIndex, startMinute) {
  const duration = block.endMinute - block.startMinute
  const clampedStart = clamp(
    startMinute,
    START_HOUR * 60,
    END_HOUR * 60 - duration,
  )

  return {
    ...block,
    dayIndex,
    startMinute: clampedStart,
    endMinute: clampedStart + duration,
  }
}

export function dragTimeBlock(original, startSlot, currentSlot) {
  const dayDelta = currentSlot.dayIndex - startSlot.dayIndex
  const minuteDelta = currentSlot.minute - startSlot.minute
  const newDayIndex = clamp(original.dayIndex + dayDelta, 0, 6)

  return moveTimeBlock(
    original,
    newDayIndex,
    original.startMinute + minuteDelta,
  )
}

export function getScrollTopForCurrentTime(wrapper) {
  const currentTime = new Date()
  const totalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
  const nowTop = ((totalMinutes - START_HOUR * 60) / 60) * CELL_HEIGHT
  const targetScroll = nowTop - wrapper.clientHeight * 0.25
  const maxScroll = Math.max(0, wrapper.scrollHeight - wrapper.clientHeight)

  return Math.max(0, Math.min(targetScroll, maxScroll))
}
