export const START_HOUR = 0
export const END_HOUR = 24
export const CELL_HEIGHT = 64
export const SNAP_MINUTES = 30
export const HORIZONTAL_SCROLL_DOMINANCE = 1.35
export const HORIZONTAL_SCROLL_LOCK_MS = 220
export const WEEK_OFFSETS = [-1, 0, 1]
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
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`
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
