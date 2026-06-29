import { useEffect, useRef, useState } from 'react'
import {
  addDays,
  addMonths,
  DAY_LABELS,
  formatHour,
  formatMonthYear,
  formatMonthYearShort,
  getMonthGrid,
  getWeekDates,
  isSameDay,
  isSameMonth,
} from '../../utils/dateUtils'

const START_HOUR = 0
const END_HOUR = 13
const CELL_HEIGHT = 64
const SNAP_MINUTES = 30
const HORIZONTAL_SCROLL_DOMINANCE = 1.35
const HORIZONTAL_SCROLL_LOCK_MS = 220
const WEEK_OFFSETS = [-1, 0, 1]
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => i + START_HOUR,
)

function loadReverseScrollSetting() {
  const stored = localStorage.getItem('reverseScroll')
  return stored === null ? true : stored === 'true'
}

function getMockEventDates(referenceDate) {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  return [2, 5, 9, 12, 18, 25].map((day) => new Date(year, month, day))
}

function formatMinutes(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`
}

function formatSelectionRange(selection) {
  return `${formatMinutes(selection.startMinute)} - ${formatMinutes(
    selection.endMinute,
  )}`
}

function getDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function resizeSelection(selection, edge, minute) {
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

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <rect
        x="2"
        y="4"
        width="16"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M2 8H18" stroke="currentColor" strokeWidth="2" />
      <path d="M6 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M10 3L5 8L10 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M6 3L11 8L6 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PanelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect
        x="1"
        y="2"
        width="16"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M7 2V16" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M9 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M14.2 10.5 13.8 9.9c.1-.3.1-.6.1-.9s0-.6-.1-.9l.4-.6-1-1.7-.7.3c-.5-.4-1.1-.7-1.7-.9l-.1-.7H7.1l-.1.7c-.6.2-1.2.5-1.7.9l-.7-.3-1 1.7.4.6c-.1.3-.1.6-.1.9s0 .6.1.9l-.4.6 1 1.7.7-.3c.5.4 1.1.7 1.7.9l.1.7h3.8l.1-.7c.6-.2 1.2-.5 1.7-.9l.7.3 1-1.7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function NavRail() {
  return (
    <nav className="nav-rail" aria-label="Main navigation">
      <div className="nav-rail__item nav-rail__item--active">
        <CalendarIcon />
      </div>
    </nav>
  )
}

function Sidebar({
  viewedMonth,
  selectedDate,
  today,
  eventDates,
  onMonthChange,
  onDateSelect,
}) {
  const cells = getMonthGrid(viewedMonth.getFullYear(), viewedMonth.getMonth())

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <button
          type="button"
          className="sidebar__nav-btn"
          aria-label="Previous month"
          onClick={() => onMonthChange(addMonths(viewedMonth, -1))}
        >
          <ChevronLeft />
        </button>
        <h2 className="sidebar__title">{formatMonthYear(viewedMonth)}</h2>
        <button
          type="button"
          className="sidebar__nav-btn"
          aria-label="Next month"
          onClick={() => onMonthChange(addMonths(viewedMonth, 1))}
        >
          <ChevronRight />
        </button>
      </div>

      <div className="sidebar__grid">
        {DAY_LABELS.map((label) => (
          <span key={label} className="sidebar__day-label">
            {label}
          </span>
        ))}

        {cells.map((date) => {
          const inMonth = isSameMonth(date, viewedMonth)
          const isToday = isSameDay(date, today)
          const isSelected = isSameDay(date, selectedDate)
          const hasEvent = eventDates.some((eventDate) => isSameDay(eventDate, date))

          return (
            <button
              key={date.toISOString()}
              type="button"
              className={[
                'sidebar__date',
                !inMonth && 'sidebar__date--outside',
                isToday && 'sidebar__date--today',
                isSelected && !isToday && 'sidebar__date--selected',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onDateSelect(date)}
            >
              <span className="sidebar__date-num">{date.getDate()}</span>
              {hasEvent && <span className="sidebar__event-dot" />}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function ViewToggle({ view, onViewChange }) {
  const views = ['Day', 'Week', 'Month']

  return (
    <div className="view-toggle">
      {views.map((label) => (
        <button
          key={label}
          type="button"
          className={`view-toggle__btn${view === label.toLowerCase() ? ' view-toggle__btn--active' : ''}`}
          onClick={() => onViewChange(label.toLowerCase())}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function SettingsPanel({ reverseScroll, onReverseScrollChange, onClose }) {
  return (
    <div className="settings-panel" role="dialog" aria-modal="true" aria-label="Settings">
      <button
        type="button"
        className="settings-panel__backdrop"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div className="settings-panel__sheet">
        <header className="settings-panel__header">
          <h2 className="settings-panel__title">Settings</h2>
          <button
            type="button"
            className="settings-panel__close"
            aria-label="Close settings"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <section className="settings-panel__section">
          <h3 className="settings-panel__section-title">Calendar</h3>
          <label className="settings-panel__option">
            <span className="settings-panel__option-label">
              Reverse horizontal scroll
            </span>
            <span className="settings-panel__option-hint">
              {reverseScroll
                ? 'Swipe left to go to the previous week'
                : 'Swipe left to go to the next week'}
            </span>
            <input
              type="checkbox"
              checked={reverseScroll}
              onChange={(event) => onReverseScrollChange(event.target.checked)}
            />
          </label>
        </section>
      </div>
    </div>
  )
}

function WeekView({
  selectedDate,
  today,
  view,
  sidebarOpen,
  reverseScroll,
  onToggleSidebar,
  onViewChange,
  onWeekChange,
  onOpenSettings,
}) {
  const daysBodyViewportRef = useRef(null)
  const gridWrapperRef = useRef(null)
  const interactionRef = useRef(null)
  const selectedDateRef = useRef(selectedDate)
  const weekScrollOffsetRef = useRef(0)
  const reverseScrollRef = useRef(reverseScroll)
  const horizontalScrollLockTimerRef = useRef(null)
  const verticalScrollLockedRef = useRef(false)
  selectedDateRef.current = selectedDate
  reverseScrollRef.current = reverseScroll
  const weekDates = getWeekDates(selectedDate)
  const [draftSelection, setDraftSelection] = useState(null)
  const [editorSelection, setEditorSelection] = useState(null)
  const [eventTitle, setEventTitle] = useState('')
  const [events, setEvents] = useState([])
  const [now, setNow] = useState(() => new Date())
  const [weekScrollOffset, setWeekScrollOffset] = useState(0)
  const [verticalScrollLocked, setVerticalScrollLocked] = useState(false)
  weekScrollOffsetRef.current = weekScrollOffset

  const scrollStyle = {
    '--week-scroll-offset': `${weekScrollOffset}px`,
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  function getScrollDelta(rawDelta) {
    return reverseScrollRef.current ? -rawDelta : rawDelta
  }

  function lockVerticalScroll() {
    verticalScrollLockedRef.current = true
    setVerticalScrollLocked(true)
    window.clearTimeout(horizontalScrollLockTimerRef.current)
    horizontalScrollLockTimerRef.current = window.setTimeout(() => {
      verticalScrollLockedRef.current = false
      setVerticalScrollLocked(false)
    }, HORIZONTAL_SCROLL_LOCK_MS)
  }

  function unlockVerticalScroll() {
    window.clearTimeout(horizontalScrollLockTimerRef.current)
    verticalScrollLockedRef.current = false
    setVerticalScrollLocked(false)
  }

  useEffect(() => {
    return () => window.clearTimeout(horizontalScrollLockTimerRef.current)
  }, [])

  function getWeekViewportWidth() {
    const viewport = daysBodyViewportRef.current
    if (!viewport) {
      return 636
    }

    return viewport.getBoundingClientRect().width
  }

  function resetWeekScroll() {
    weekScrollOffsetRef.current = 0
    setWeekScrollOffset(0)
  }

  function dismissEditor() {
    setEditorSelection(null)
    setDraftSelection(null)
    setEventTitle('')
  }

  function navigateWeek(dayDelta) {
    resetWeekScroll()
    onWeekChange(addDays(selectedDate, dayDelta))
  }

  function applyWeekScrollDelta(rawDelta) {
    const delta = getScrollDelta(rawDelta)
    if (delta === 0) {
      return
    }

    const weekWidth = getWeekViewportWidth()
    if (weekWidth <= 0) {
      return
    }

    let next = weekScrollOffsetRef.current + delta
    let weekDelta = 0

    while (next >= weekWidth) {
      weekDelta -= 7
      next -= weekWidth
    }

    while (next <= -weekWidth) {
      weekDelta += 7
      next += weekWidth
    }

    weekScrollOffsetRef.current = next
    setWeekScrollOffset(next)

    if (weekDelta !== 0) {
      onWeekChange(addDays(selectedDateRef.current, weekDelta))
      dismissEditor()
    }
  }

  useEffect(() => {
    const wrapper = gridWrapperRef.current
    if (!wrapper) {
      return
    }

    function handleWheel(event) {
      const deltaX =
        event.deltaX !== 0 ? event.deltaX : event.shiftKey ? event.deltaY : 0
      const absX = Math.abs(deltaX)
      const absY = Math.abs(event.deltaY)

      if (verticalScrollLockedRef.current) {
        event.preventDefault()
        if (absX > 0) {
          lockVerticalScroll()
          applyWeekScrollDelta(deltaX)
        }
        return
      }

      if (absX === 0 || absX <= absY * HORIZONTAL_SCROLL_DOMINANCE) {
        return
      }

      event.preventDefault()
      lockVerticalScroll()
      applyWeekScrollDelta(deltaX)
    }

    wrapper.addEventListener('wheel', handleWheel, { passive: false })
    return () => wrapper.removeEventListener('wheel', handleWheel)
  }, [onWeekChange])

  useEffect(() => {
    if (!editorSelection) {
      return
    }

    function handlePointerDownCapture(event) {
      if (event.target.closest('.event-editor')) {
        return
      }

      dismissEditor()
      interactionRef.current = {
        mode: 'dismiss',
        pointerId: event.pointerId,
      }
    }

    function handlePointerUpCapture(event) {
      if (interactionRef.current?.mode === 'dismiss') {
        interactionRef.current = null
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        dismissEditor()
      }
    }

    document.addEventListener('pointerdown', handlePointerDownCapture, true)
    document.addEventListener('pointerup', handlePointerUpCapture, true)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownCapture, true)
      document.removeEventListener('pointerup', handlePointerUpCapture, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editorSelection])

  function getPointerSlot(event) {
    const viewport = daysBodyViewportRef.current
    if (!viewport) {
      return null
    }

    const viewportRect = viewport.getBoundingClientRect()
    const x = event.clientX - viewportRect.left
    const y = event.clientY - viewportRect.top
    const dayWidth = viewportRect.width / 7
    const weekWidth = viewportRect.width
    const trackX = x - weekScrollOffsetRef.current + weekWidth
    const dayColumn = Math.floor(trackX / dayWidth)

    if (dayColumn < 7 || dayColumn >= 14 || y < 0) {
      return null
    }

    const dayIndex = dayColumn - 7
    const totalGridMinutes = (END_HOUR - START_HOUR) * 60
    const rawMinutes = START_HOUR * 60 + (y / CELL_HEIGHT) * 60
    const snappedMinutes =
      Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES
    const minute = clamp(
      snappedMinutes,
      START_HOUR * 60,
      START_HOUR * 60 + totalGridMinutes,
    )

    return {
      dayIndex,
      minute,
      x,
      y,
    }
  }

  function buildSelection(startSlot, endSlot) {
    const startMinute = Math.min(startSlot.minute, endSlot.minute)
    const endMinute = Math.max(startSlot.minute, endSlot.minute)
    const safeEndMinute =
      endMinute === startMinute ? startMinute + SNAP_MINUTES : endMinute

    return {
      dayIndex: startSlot.dayIndex,
      startMinute,
      endMinute: clamp(safeEndMinute, START_HOUR * 60, END_HOUR * 60),
    }
  }

  function getSelectionStyle(selection) {
    return {
      '--selection-day-index': selection.dayIndex,
      '--selection-top': `${
        ((selection.startMinute - START_HOUR * 60) / 60) * CELL_HEIGHT
      }px`,
      '--selection-height': `${
        ((selection.endMinute - selection.startMinute) / 60) * CELL_HEIGHT
      }px`,
    }
  }

  function getNowIndicatorStyle(dayIndex) {
    const totalMinutes = now.getHours() * 60 + now.getMinutes()

    if (totalMinutes < START_HOUR * 60 || totalMinutes > END_HOUR * 60) {
      return null
    }

    return {
      '--now-day-index': dayIndex,
      '--now-top': `${
        ((totalMinutes - START_HOUR * 60) / 60) * CELL_HEIGHT
      }px`,
    }
  }

  function getEditorClassName(selection) {
    return [
      'event-editor',
      selection.dayIndex > 4 && 'event-editor--flip-x',
      selection.endMinute >= (END_HOUR - 2) * 60 && 'event-editor--flip-y',
    ]
      .filter(Boolean)
      .join(' ')
  }

  function handleGridPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) {
      return
    }

    if (interactionRef.current?.mode === 'dismiss') {
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }

    const startSlot = getPointerSlot(event)
    if (!startSlot) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    interactionRef.current = {
      mode: 'pending',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startSlot,
    }
  }

  function handleGridPointerMove(event) {
    const interaction = interactionRef.current
    if (!interaction || interaction.pointerId !== event.pointerId) {
      return
    }

    if (interaction.mode === 'dismiss') {
      return
    }

    if (
      interaction.mode === 'resize-selection' ||
      interaction.mode === 'resize-event'
    ) {
      const currentSlot = getPointerSlot(event)
      if (!currentSlot || currentSlot.dayIndex !== interaction.selection.dayIndex) {
        return
      }

      const nextSelection = resizeSelection(
        interaction.selection,
        interaction.edge,
        currentSlot.minute,
      )

      interaction.selection = nextSelection

      if (interaction.mode === 'resize-selection') {
        setDraftSelection(nextSelection)
        setEditorSelection(nextSelection)
        return
      }

      setEvents((currentEvents) =>
        currentEvents.map((calendarEvent) =>
          calendarEvent.id === interaction.eventId
            ? { ...calendarEvent, ...nextSelection }
            : calendarEvent,
        ),
      )
      return
    }

    const dx = event.clientX - interaction.startX
    const dy = event.clientY - interaction.startY

    if (
      interaction.mode === 'week-scroll' ||
      (interaction.mode === 'pending' &&
        Math.abs(dx) > 8 &&
        Math.abs(dx) > Math.abs(dy) * HORIZONTAL_SCROLL_DOMINANCE)
    ) {
      if (interaction.mode === 'pending') {
        interaction.mode = 'week-scroll'
        interaction.lastScrollX = event.clientX
        setDraftSelection(null)
        lockVerticalScroll()
      }

      applyWeekScrollDelta(event.clientX - interaction.lastScrollX)
      interaction.lastScrollX = event.clientX
      return
    }

    const currentSlot = getPointerSlot(event)
    if (!currentSlot || currentSlot.dayIndex !== interaction.startSlot.dayIndex) {
      return
    }

    if (Math.abs(dy) > 4 || interaction.mode === 'selecting') {
      interaction.mode = 'selecting'
      setDraftSelection(buildSelection(interaction.startSlot, currentSlot))
    }
  }

  function handleGridPointerUp(event) {
    const interaction = interactionRef.current
    if (!interaction || interaction.pointerId !== event.pointerId) {
      return
    }

    if (interaction.mode === 'dismiss') {
      interactionRef.current = null
      return
    }

    if (interaction.mode === 'week-scroll') {
      interactionRef.current = null
      setDraftSelection(null)
      unlockVerticalScroll()
      return
    }

    if (
      interaction.mode === 'resize-selection' ||
      interaction.mode === 'resize-event'
    ) {
      interactionRef.current = null
      return
    }

    const endSlot = getPointerSlot(event) ?? interaction.startSlot
    const selection =
      draftSelection ?? buildSelection(interaction.startSlot, endSlot)

    setDraftSelection(selection)
    setEditorSelection(selection)
    interactionRef.current = null
  }

  function handleGridPointerCancel() {
    interactionRef.current = null
    setDraftSelection(null)
  }

  function handleResizeSelectionPointerDown(event, edge, selection) {
    event.stopPropagation()
    daysBodyViewportRef.current.setPointerCapture(event.pointerId)
    interactionRef.current = {
      mode: 'resize-selection',
      pointerId: event.pointerId,
      edge,
      selection,
    }
  }

  function handleResizeEventPointerDown(event, edge, calendarEvent) {
    event.stopPropagation()
    daysBodyViewportRef.current.setPointerCapture(event.pointerId)
    interactionRef.current = {
      mode: 'resize-event',
      pointerId: event.pointerId,
      edge,
      eventId: calendarEvent.id,
      selection: calendarEvent,
    }
  }

  function handleSaveEvent() {
    if (!editorSelection) {
      return
    }

    setEvents((currentEvents) => [
      ...currentEvents,
      {
        id: crypto.randomUUID(),
        dateKey: getDateKey(weekDates[editorSelection.dayIndex]),
        title: eventTitle.trim() || 'New event',
        ...editorSelection,
      },
    ])
    dismissEditor()
  }

  const visibleSelection = editorSelection ?? draftSelection

  function renderWeekHeaders(weekOffset) {
    const dates = getWeekDates(addDays(selectedDate, weekOffset * 7))

    return (
      <div className="week-view__week-headers" key={`headers-${weekOffset}`}>
        {dates.map((date) => {
          const isToday = isSameDay(date, today)
          return (
            <div
              key={date.toISOString()}
              className={`week-view__day-header${isToday ? ' week-view__day-header--today' : ''}`}
            >
              <span className="week-view__day-name">
                {DAY_LABELS[date.getDay()]}
              </span>
              <span className="week-view__day-num">
                {String(date.getDate()).padStart(2, '0')}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  function renderWeekColumns(weekOffset) {
    const dates = getWeekDates(addDays(selectedDate, weekOffset * 7))
    const weekTodayIndex = dates.findIndex((date) => isSameDay(date, today))
    const weekNowIndicatorStyle =
      weekTodayIndex >= 0 ? getNowIndicatorStyle(weekTodayIndex) : null

    return (
      <div className="week-view__week-columns" key={`columns-${weekOffset}`}>
        {dates.map((date) => (
          <div key={date.toISOString()} className="week-view__day-column">
            {HOURS.map((hour) => (
              <div
                key={`${date.toISOString()}-${hour}`}
                className="week-view__cell"
              />
            ))}

            {events
              .filter((event) => event.dateKey === getDateKey(date))
              .map((event) => (
                <div
                  key={event.id}
                  className="week-view__event"
                  style={getSelectionStyle(event)}
                >
                  <button
                    type="button"
                    className="week-view__resize-handle week-view__resize-handle--start"
                    aria-label="Resize event start time"
                    onPointerDown={(pointerEvent) =>
                      handleResizeEventPointerDown(pointerEvent, 'start', event)
                    }
                  />
                  <strong>{event.title}</strong>
                  <span>{formatSelectionRange(event)}</span>
                  <button
                    type="button"
                    className="week-view__resize-handle week-view__resize-handle--end"
                    aria-label="Resize event end time"
                    onPointerDown={(pointerEvent) =>
                      handleResizeEventPointerDown(pointerEvent, 'end', event)
                    }
                  />
                </div>
              ))}
          </div>
        ))}

        {weekOffset === 0 && weekNowIndicatorStyle && (
          <div
            className="week-view__now-indicator"
            style={weekNowIndicatorStyle}
            aria-hidden="true"
          />
        )}

        {weekOffset === 0 && visibleSelection && (
          <div
            className={`week-view__selection${
              editorSelection ? ' week-view__selection--editing' : ''
            }`}
            style={getSelectionStyle(visibleSelection)}
          >
            <button
              type="button"
              className="week-view__resize-handle week-view__resize-handle--start"
              aria-label="Resize selected start time"
              onPointerDown={(event) =>
                handleResizeSelectionPointerDown(event, 'start', visibleSelection)
              }
            />
            <strong>{eventTitle.trim() || 'New event'}</strong>
            <span>{formatSelectionRange(visibleSelection)}</span>
            <button
              type="button"
              className="week-view__resize-handle week-view__resize-handle--end"
              aria-label="Resize selected end time"
              onPointerDown={(event) =>
                handleResizeSelectionPointerDown(event, 'end', visibleSelection)
              }
            />
          </div>
        )}

        {weekOffset === 0 && editorSelection && (
          <form
            className={getEditorClassName(editorSelection)}
            style={getSelectionStyle(editorSelection)}
            onPointerDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault()
              handleSaveEvent()
            }}
          >
            <div className="event-editor__header">
              <span className="event-editor__dot" />
              <div>
                <h2>Create event</h2>
                <p>{formatSelectionRange(editorSelection)}</p>
              </div>
            </div>
            <label className="event-editor__field">
              <span>Name</span>
              <input
                autoFocus
                value={eventTitle}
                placeholder="New event"
                onChange={(event) => setEventTitle(event.target.value)}
              />
            </label>
            <div className="event-editor__field">
              <span>Time</span>
              <strong>{formatSelectionRange(editorSelection)}</strong>
            </div>
            <label className="event-editor__field">
              <span>Note</span>
              <input placeholder="Memo, URL, or details" />
            </label>
            <div className="event-editor__actions">
              <button
                type="button"
                className="event-editor__ghost-btn"
                onClick={dismissEditor}
              >
                Cancel
              </button>
              <button type="submit" className="event-editor__save-btn">
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="week-view">
      <header className="week-view__header">
        <div className="week-view__nav">
          <button
            type="button"
            className={`week-view__sidebar-toggle${sidebarOpen ? ' week-view__sidebar-toggle--active' : ''}`}
            aria-label={sidebarOpen ? 'Hide month sidebar' : 'Show month sidebar'}
            aria-pressed={sidebarOpen}
            onClick={onToggleSidebar}
          >
            <PanelIcon />
          </button>
          <button
            type="button"
            className="week-view__nav-btn"
            aria-label="Previous week"
            onClick={() => navigateWeek(-7)}
          >
            <ChevronLeft />
          </button>
          <h1 className="week-view__title">{formatMonthYearShort(selectedDate)}</h1>
          <button
            type="button"
            className="week-view__nav-btn"
            aria-label="Next week"
            onClick={() => navigateWeek(7)}
          >
            <ChevronRight />
          </button>
        </div>
        <div className="week-view__header-actions">
          <ViewToggle view={view} onViewChange={onViewChange} />
          <button
            type="button"
            className="week-view__settings-btn"
            aria-label="Open settings"
            onClick={onOpenSettings}
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      <div
        className={`week-view__grid-wrapper${verticalScrollLocked ? ' week-view__grid-wrapper--lock-y' : ''}`}
        ref={gridWrapperRef}
      >
        <div className="week-view__grid">
          <div className="week-view__corner" />

          <div className="week-view__days-header-viewport" style={scrollStyle}>
            <div className="week-view__days-track">
              {WEEK_OFFSETS.map((weekOffset) => renderWeekHeaders(weekOffset))}
            </div>
          </div>

          <div className="week-view__time-body">
            <div className="week-view__time-labels">
              {HOURS.map((hour) => (
                <div key={hour} className="week-view__time-label">
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            <div
              ref={daysBodyViewportRef}
              className="week-view__days-body-viewport"
              style={scrollStyle}
              onPointerDown={handleGridPointerDown}
              onPointerMove={handleGridPointerMove}
              onPointerUp={handleGridPointerUp}
              onPointerCancel={handleGridPointerCancel}
            >
              <div className="week-view__days-track">
                {WEEK_OFFSETS.map((weekOffset) => renderWeekColumns(weekOffset))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Calendar() {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today)
  const [viewedMonth, setViewedMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [view, setView] = useState('week')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [reverseScroll, setReverseScroll] = useState(loadReverseScrollSetting)

  useEffect(() => {
    localStorage.setItem('reverseScroll', String(reverseScroll))
  }, [reverseScroll])

  function handleDateSelect(date) {
    setSelectedDate(date)
    if (!isSameMonth(date, viewedMonth)) {
      setViewedMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }

  function handleWeekChange(date) {
    setSelectedDate(date)
    if (!isSameMonth(date, viewedMonth)) {
      setViewedMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }

  return (
    <div className="calendar">
      <NavRail />
      <aside
        className={`month-sidebar${sidebarOpen ? ' month-sidebar--open' : ''}`}
        aria-hidden={!sidebarOpen}
      >
        <Sidebar
          viewedMonth={viewedMonth}
          selectedDate={selectedDate}
          today={today}
          eventDates={getMockEventDates(viewedMonth)}
          onMonthChange={setViewedMonth}
          onDateSelect={handleDateSelect}
        />
      </aside>
      <WeekView
        selectedDate={selectedDate}
        today={today}
        view={view}
        sidebarOpen={sidebarOpen}
        reverseScroll={reverseScroll}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onViewChange={setView}
        onWeekChange={handleWeekChange}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      {settingsOpen && (
        <SettingsPanel
          reverseScroll={reverseScroll}
          onReverseScrollChange={setReverseScroll}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
