import { useEffect, useRef, useState } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PanelIcon,
} from './icons'
import { useCalendarTodos } from '../hooks/useCalendarTodos'
import { formatTodoTime } from '../utils/calendarTodos'
import {
  addDays,
  addMonths,
  DAY_LABELS,
  formatHour,
  formatMonthYear,
  formatMonthYearShort,
  getMonthGrid,
  getWeekDates,
  getWeekNumber,
  isSameDay,
  isSameMonth,
} from '../utils/dateUtils'

const START_HOUR = 0
const END_HOUR = 24
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

function formatDigitalClock(date) {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 === 0 ? 12 : hours % 12

  return {
    hours: String(displayHour).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    period,
  }
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

function moveTimeBlock(block, dayIndex, startMinute) {
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

function dragTimeBlock(original, startSlot, currentSlot) {
  const dayDelta = currentSlot.dayIndex - startSlot.dayIndex
  const minuteDelta = currentSlot.minute - startSlot.minute
  const newDayIndex = clamp(original.dayIndex + dayDelta, 0, 6)

  return moveTimeBlock(
    original,
    newDayIndex,
    original.startMinute + minuteDelta,
  )
}

function Sidebar({
  viewedMonth,
  selectedDate,
  today,
  eventDates,
  sidebarOpen,
  onMonthChange,
  onDateSelect,
  onToggleSidebar,
}) {
  const cells = getMonthGrid(viewedMonth.getFullYear(), viewedMonth.getMonth())
  const { todos, addTodo, toggleTodo, deleteTodo } = useCalendarTodos()
  const [todoDraft, setTodoDraft] = useState('')

  function commitTodoDraft(text) {
    const trimmed = text.trim()
    if (!trimmed) {
      return
    }

    addTodo(trimmed)
  }

  function handleTodoKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }

    event.preventDefault()
    commitTodoDraft(todoDraft)
    setTodoDraft('')
  }

  function handleTodoPaste(event) {
    const pasted = event.clipboardData.getData('text')
    if (!pasted.includes('\n')) {
      return
    }

    event.preventDefault()
    pasted
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => addTodo(line))
    setTodoDraft('')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-month">
        <div className="sidebar-header">
          <h2 className="sidebar-title">{formatMonthYear(viewedMonth)}</h2>
          <button
            type="button"
            className="sidebar-panel-toggle"
            aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            aria-pressed={sidebarOpen}
            onClick={onToggleSidebar}
          >
            <PanelIcon />
          </button>
        </div>

        <div className="sidebar-grid">
          {DAY_LABELS.map((label) => (
            <span key={label} className="sidebar-day-label">
              {label.charAt(0)}
            </span>
          ))}

          {cells.map((date) => {
            const inMonth = isSameMonth(date, viewedMonth)
            const isToday = isSameDay(date, today)
            const isSelected = isSameDay(date, selectedDate)
            const hasEvent = eventDates.some((eventDate) =>
              isSameDay(eventDate, date),
            )

            return (
              <button
                key={date.toISOString()}
                type="button"
                className={[
                  'sidebar-date',
                  !inMonth && 'sidebar-date-outside',
                  isToday && 'sidebar-date-today',
                  isSelected && !isToday && 'sidebar-date-selected',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onDateSelect(date)}
              >
                <span className="sidebar-date-num">{date.getDate()}</span>
                {hasEvent && <span className="sidebar-event-dot" />}
              </button>
            )
          })}
        </div>
      </div>

      <section className="sidebar-todos">
        <h3 className="sidebar-todos-title">Upcoming Tasks</h3>

        {todos.length > 0 && (
          <ul className="sidebar-todos-list">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className={`sidebar-todos-item${
                  todo.done ? ' sidebar-todos-item-done' : ''
                }`}
              >
                <label className="sidebar-todos-check">
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => toggleTodo(todo.id)}
                    aria-label={`Mark "${todo.text}" as ${
                      todo.done ? 'incomplete' : 'complete'
                    }`}
                  />
                  <span className="sidebar-todos-checkmark" />
                </label>
                <div className="sidebar-todos-content">
                  <span className="sidebar-todos-text">{todo.text}</span>
                  {todo.timeMinute != null && (
                    <span className="sidebar-todos-time">
                      {formatTodoTime(todo.timeMinute)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="sidebar-todos-delete-btn"
                  aria-label={`Delete "${todo.text}"`}
                  onClick={() => deleteTodo(todo.id)}
                >
                  ×
                </button>
              </li>
            ))}
            <textarea
              className={`sidebar-todos-empty${
                todos.length === 0 ? ' sidebar-todos-empty-solo' : ''
                    }`}
                placeholder="Add a task..."
                value={todoDraft}
                rows={todos.length > 0 ? 1 : 4}
                aria-label="Add tasks"
                onChange={(event) => setTodoDraft(event.target.value)}
                onKeyDown={handleTodoKeyDown}
                onPaste={handleTodoPaste}
              />
          </ul>
        )}


      </section>
    </aside>
  )
}

function SettingsPanel({ reverseScroll, onReverseScrollChange, onClose }) {
  return (
    <div className="settings-panel" role="dialog" aria-modal="true" aria-label="Settings">
      <button
        type="button"
        className="settings-panel-backdrop"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div className="settings-panel-sheet">
        <header className="settings-panel-header">
          <h2 className="settings-panel-title">Settings</h2>
          <button
            type="button"
            className="settings-panel-close"
            aria-label="Close settings"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <section className="settings-panel-section">
          <h3 className="settings-panel-section-title">Calendar</h3>
          <label className="settings-panel-option">
            <span className="settings-panel-option-label">
              Reverse horizontal scroll
            </span>
            <span className="settings-panel-option-hint">
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

function getScrollTopForCurrentTime(wrapper) {
  const currentTime = new Date()
  const totalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
  const nowTop = ((totalMinutes - START_HOUR * 60) / 60) * CELL_HEIGHT
  const targetScroll = nowTop - wrapper.clientHeight * 0.25
  const maxScroll = Math.max(0, wrapper.scrollHeight - wrapper.clientHeight)

  return Math.max(0, Math.min(targetScroll, maxScroll))
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
}) {
  const daysBodyViewportRef = useRef(null)
  const gridWrapperRef = useRef(null)
  const weekViewRef = useRef(null)
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
  const [editingEventId, setEditingEventId] = useState(null)
  const [eventTitle, setEventTitle] = useState('')
  const [events, setEvents] = useState([])
  const [now, setNow] = useState(() => new Date())
  const [weekScrollOffset, setWeekScrollOffset] = useState(0)
  const [verticalScrollLocked, setVerticalScrollLocked] = useState(false)
  weekScrollOffsetRef.current = weekScrollOffset

  const scrollStyle = {
    '--week-scroll-offset': `${weekScrollOffset}px`,
  }

  function scrollToCurrentTime() {
    const wrapper = gridWrapperRef.current
    if (!wrapper || wrapper.clientHeight === 0) {
      return false
    }

    const dates = getWeekDates(selectedDateRef.current)
    const includesToday = dates.some((date) => isSameDay(date, today))
    if (!includesToday) {
      return true
    }

    wrapper.scrollTop = getScrollTopForCurrentTime(wrapper)
    return true
  }

  useEffect(() => {
    let frameId = 0

    function attemptScroll() {
      if (!scrollToCurrentTime()) {
        frameId = window.requestAnimationFrame(attemptScroll)
      }
    }

    frameId = window.requestAnimationFrame(attemptScroll)
    return () => window.cancelAnimationFrame(frameId)
  }, [selectedDate, today])

  useEffect(() => {
    const root = weekViewRef.current
    if (!root) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(scrollToCurrentTime)
        })
      },
      { threshold: 0.01 },
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1_000)
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
    setEditingEventId(null)
    setEditorSelection(null)
    setDraftSelection(null)
    setEventTitle('')
  }

  function handleDeleteEvent() {
    if (!editingEventId) {
      return
    }

    setEvents((currentEvents) =>
      currentEvents.filter((calendarEvent) => calendarEvent.id !== editingEventId),
    )
    dismissEditor()
  }

  function openEventEditor(calendarEvent) {
    setEditingEventId(calendarEvent.id)
    setEditorSelection({
      dayIndex: calendarEvent.dayIndex,
      startMinute: calendarEvent.startMinute,
      endMinute: calendarEvent.endMinute,
    })
    setEventTitle(calendarEvent.title)
    setDraftSelection(null)
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

      if (event.target.closest('.week-view-event')) {
        return
      }

      if (event.target.closest('.week-view-selection')) {
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
        return
      }

      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return
      }

      if (!editingEventId) {
        return
      }

      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        if (target.value !== '') {
          return
        }
      }

      event.preventDefault()
      handleDeleteEvent()
    }

    document.addEventListener('pointerdown', handlePointerDownCapture, true)
    document.addEventListener('pointerup', handlePointerUpCapture, true)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownCapture, true)
      document.removeEventListener('pointerup', handlePointerUpCapture, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editorSelection, editingEventId])

  function getPointerSlot(event) {
    const viewport = daysBodyViewportRef.current
    if (!viewport) {
      return null
    }

    const viewportRect = viewport.getBoundingClientRect()
    const x = event.clientX - viewportRect.left
    const y = event.clientY - viewportRect.top

    if (y < 0) {
      return null
    }

    const track = viewport.querySelector('.week-view-days-track')
    const currentWeekPanel = track?.children?.[1]
    if (!currentWeekPanel) {
      return null
    }

    const columns = currentWeekPanel.querySelectorAll(
      ':scope > .week-view-day-column',
    )
    let dayIndex = null

    for (let index = 0; index < columns.length; index++) {
      const rect = columns[index].getBoundingClientRect()
      const isLastColumn = index === columns.length - 1

      if (
        event.clientX >= rect.left &&
        (event.clientX < rect.right || isLastColumn)
      ) {
        dayIndex = index
      }
    }

    if (dayIndex == null) {
      return null
    }

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

  function getEventStyle(selection) {
    return {
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
      selection.dayIndex > 4 && 'event-editor-flip-x',
      selection.endMinute >= (END_HOUR - 2) * 60 && 'event-editor-flip-y',
    ]
      .filter(Boolean)
      .join(' ')
  }

  function handleGridPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) {
      return
    }

    if (event.target.closest('.week-view-event')) {
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

    if (
      interaction.mode === 'pending-event-drag' ||
      interaction.mode === 'drag-event' ||
      interaction.mode === 'pending-selection-drag' ||
      interaction.mode === 'drag-selection'
    ) {
      const dx = event.clientX - interaction.startX
      const dy = event.clientY - interaction.startY

      if (
        interaction.mode === 'pending-event-drag' ||
        interaction.mode === 'pending-selection-drag'
      ) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
          return
        }

        interaction.mode =
          interaction.mode === 'pending-event-drag'
            ? 'drag-event'
            : 'drag-selection'
      }

      const currentSlot = getPointerSlot(event)
      if (!currentSlot) {
        return
      }

      const nextBlock = dragTimeBlock(
        interaction.original,
        interaction.startSlot,
        currentSlot,
      )

      if (interaction.mode === 'drag-event') {
        setEvents((currentEvents) =>
          currentEvents.map((calendarEvent) =>
            calendarEvent.id === interaction.calendarEvent.id
              ? {
                  ...calendarEvent,
                  ...nextBlock,
                  dateKey: getDateKey(weekDates[nextBlock.dayIndex]),
                }
              : calendarEvent,
          ),
        )

        if (editingEventId === interaction.calendarEvent.id) {
          setEditorSelection(nextBlock)
        }
      } else {
        setDraftSelection(nextBlock)
        setEditorSelection(nextBlock)
      }

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

    if (interaction.mode === 'pending-event-drag') {
      openEventEditor(interaction.calendarEvent)
      interactionRef.current = null
      return
    }

    if (
      interaction.mode === 'drag-event' ||
      interaction.mode === 'drag-selection'
    ) {
      interactionRef.current = null
      return
    }

    if (interaction.mode === 'pending-selection-drag') {
      interactionRef.current = null
      return
    }

    const endSlot = getPointerSlot(event) ?? interaction.startSlot
    const selection =
      draftSelection ?? buildSelection(interaction.startSlot, endSlot)

    setDraftSelection(selection)
    setEditingEventId(null)
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

  function handleEventPointerDown(pointerEvent, calendarEvent) {
    if (pointerEvent.target.closest('.week-view-resize-handle')) {
      return
    }

    pointerEvent.stopPropagation()
    const startSlot = getPointerSlot(pointerEvent)
    if (!startSlot) {
      return
    }

    daysBodyViewportRef.current.setPointerCapture(pointerEvent.pointerId)
    interactionRef.current = {
      mode: 'pending-event-drag',
      pointerId: pointerEvent.pointerId,
      startX: pointerEvent.clientX,
      startY: pointerEvent.clientY,
      startSlot,
      original: {
        dayIndex: calendarEvent.dayIndex,
        startMinute: calendarEvent.startMinute,
        endMinute: calendarEvent.endMinute,
      },
      calendarEvent,
    }
  }

  function handleSelectionPointerDown(event, selection) {
    if (event.target.closest('.week-view-resize-handle')) {
      return
    }

    event.stopPropagation()
    const startSlot = getPointerSlot(event)
    if (!startSlot) {
      return
    }

    daysBodyViewportRef.current.setPointerCapture(event.pointerId)
    interactionRef.current = {
      mode: 'pending-selection-drag',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startSlot,
      original: { ...selection },
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

  function handleNewEvent() {
    const todayIndex = weekDates.findIndex((date) => isSameDay(date, today))
    const dayIndex =
      todayIndex >= 0
        ? todayIndex
        : weekDates.findIndex((date) => isSameDay(date, selectedDate))

    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const snappedStart =
      Math.ceil(nowMinutes / SNAP_MINUTES) * SNAP_MINUTES || 9 * 60
    const startMinute = clamp(snappedStart, START_HOUR * 60, END_HOUR * 60 - 90)
    const selection = {
      dayIndex: dayIndex >= 0 ? dayIndex : 0,
      startMinute,
      endMinute: startMinute + 90,
    }

    setDraftSelection(selection)
    setEditorSelection(selection)
    setEditingEventId(null)
    setEventTitle('')
  }

  function handleSaveEvent() {
    if (!editorSelection) {
      return
    }

    const title = eventTitle.trim() || 'New event'

    if (editingEventId) {
      setEvents((currentEvents) =>
        currentEvents.map((calendarEvent) =>
          calendarEvent.id === editingEventId
            ? {
                ...calendarEvent,
                title,
                dayIndex: editorSelection.dayIndex,
                startMinute: editorSelection.startMinute,
                endMinute: editorSelection.endMinute,
              }
            : calendarEvent,
        ),
      )
    } else {
      setEvents((currentEvents) => [
        ...currentEvents,
        {
          id: crypto.randomUUID(),
          dateKey: getDateKey(weekDates[editorSelection.dayIndex]),
          title,
          ...editorSelection,
        },
      ])
    }

    dismissEditor()
  }

  const visibleSelection = editingEventId ? draftSelection : editorSelection ?? draftSelection
  const digitalClock = formatDigitalClock(now)

  function renderWeekHeaders(weekOffset) {
    const dates = getWeekDates(addDays(selectedDate, weekOffset * 7))

    return (
      <div className="week-view-week-headers" key={`headers-${weekOffset}`}>
        {dates.map((date) => {
          const isToday = isSameDay(date, today)
          return (
            <div
              key={date.toISOString()}
              className={`week-view-day-header${isToday ? ' week-view-day-header-today' : ''}`}
            >
              <span className="week-view-day-name">
                {DAY_LABELS[date.getDay()]}
              </span>
              <span className="week-view-day-num">
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
      <div className="week-view-week-columns" key={`columns-${weekOffset}`}>
        {dates.map((date) => {
          const isToday = isSameDay(date, today)
          return (
            <div
              key={date.toISOString()}
              className={`week-view-day-column${
                isToday ? ' week-view-day-column-today' : ''
              }`}
            >
            {HOURS.map((hour) => (
              <div
                key={`${date.toISOString()}-${hour}`}
                className="week-view-cell"
              />
            ))}

            {events
              .filter((event) => event.dateKey === getDateKey(date))
              .map((event) => (
                <div
                  key={event.id}
                  className={`week-view-event${
                    editingEventId === event.id ? ' week-view-event-editing' : ''
                  }`}
                  style={getEventStyle(event)}
                  onPointerDown={(pointerEvent) =>
                    handleEventPointerDown(pointerEvent, event)
                  }
                >
                  <button
                    type="button"
                    className="week-view-resize-handle week-view-resize-handle-start"
                    aria-label="Resize event start time"
                    onPointerDown={(pointerEvent) =>
                      handleResizeEventPointerDown(pointerEvent, 'start', event)
                    }
                  />
                  <strong>{event.title}</strong>
                  <span>{formatSelectionRange(event)}</span>
                  <button
                    type="button"
                    className="week-view-resize-handle week-view-resize-handle-end"
                    aria-label="Resize event end time"
                    onPointerDown={(pointerEvent) =>
                      handleResizeEventPointerDown(pointerEvent, 'end', event)
                    }
                  />
                </div>
              ))}
          </div>
          )
        })}

        {weekOffset === 0 && weekNowIndicatorStyle && (
          <div
            className="week-view-now-indicator"
            style={weekNowIndicatorStyle}
            aria-hidden="true"
          />
        )}

        {weekOffset === 0 && visibleSelection && (
          <div
            className={`week-view-selection${
              editorSelection ? ' week-view-selection-editing' : ''
            }`}
            style={getSelectionStyle(visibleSelection)}
            onPointerDown={(event) =>
              handleSelectionPointerDown(event, visibleSelection)
            }
          >
            <button
              type="button"
              className="week-view-resize-handle week-view-resize-handle-start"
              aria-label="Resize selected start time"
              onPointerDown={(event) =>
                handleResizeSelectionPointerDown(event, 'start', visibleSelection)
              }
            />
            <strong>{eventTitle.trim() || 'New event'}</strong>
            <span>{formatSelectionRange(visibleSelection)}</span>
            <button
              type="button"
              className="week-view-resize-handle week-view-resize-handle-end"
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
            <div className="event-editor-header">
              <div>
                <h2>{editingEventId ? 'Edit event' : 'Create event'}</h2>
                <p>{formatSelectionRange(editorSelection)}</p>
              </div>
            </div>
            <label className="event-editor-field">
              <span>Name</span>
              <input
                autoFocus={!editingEventId}
                value={eventTitle}
                placeholder="New event"
                onChange={(event) => setEventTitle(event.target.value)}
              />
            </label>
            <div className="event-editor-field">
              <span>Time</span>
              <strong>{formatSelectionRange(editorSelection)}</strong>
            </div>
            <label className="event-editor-field">
              <span>Note</span>
              <input placeholder="Memo, URL, or details" />
            </label>
            <div className="event-editor-actions">
              <button
                type="button"
                className="event-editor-ghost-btn"
                onClick={dismissEditor}
              >
                Cancel
              </button>
              <button type="submit" className="event-editor-save-btn">
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="week-view" ref={weekViewRef}>
      <header className="week-view-header">
        <div className="week-view-week-picker">
          {!sidebarOpen && (
            <button
              type="button"
              className="week-view-sidebar-reopen"
              aria-label="Show sidebar"
              onClick={onToggleSidebar}
            >
              <PanelIcon />
            </button>
          )}
          <div className="week-view-week-picker-inner">
          <button
            type="button"
            className="week-view-week-picker-btn"
            aria-label="Previous week"
            onClick={() => navigateWeek(-7)}
          >
            <ChevronLeftIcon />
          </button>
          <span className="week-view-week-label">
            Week {getWeekNumber(selectedDate)}
          </span>
          <button
            type="button"
            className="week-view-week-picker-btn"
            aria-label="Next week"
            onClick={() => navigateWeek(7)}
          >
            <ChevronRightIcon />
          </button>
          </div>
        </div>

        <div className="week-view-header-center">
          <div className="week-view-title-group">
            <h1 className="week-view-title">{formatMonthYearShort(selectedDate)}</h1>
          </div>
          <time
            className="week-view-clock"
            dateTime={now.toISOString()}
            aria-label={`Current time ${digitalClock.hours}:${digitalClock.minutes} ${digitalClock.period}`}
          >
            <span className="week-view-clock-digit">{digitalClock.hours}</span>
            <span className="week-view-clock-separator" aria-hidden="true">
              :
            </span>
            <span className="week-view-clock-digit">{digitalClock.minutes}</span>
            <span className="week-view-clock-period">{digitalClock.period}</span>
          </time>
        </div>

      </header>

      <div
        className={`week-view-grid-wrapper${verticalScrollLocked ? ' week-view-grid-wrapper-lock-y' : ''}`}
        ref={gridWrapperRef}
      >
        <div className="week-view-grid">
          <div className="week-view-corner">GMT +1</div>

          <div className="week-view-days-header-viewport" style={scrollStyle}>
            <div className="week-view-days-track">
              {WEEK_OFFSETS.map((weekOffset) => renderWeekHeaders(weekOffset))}
            </div>
          </div>

          <div className="week-view-time-body">
            <div className="week-view-time-labels">
              {HOURS.map((hour) => (
                <div key={hour} className="week-view-time-label">
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            <div
              ref={daysBodyViewportRef}
              className="week-view-days-body-viewport"
              style={scrollStyle}
              onPointerDown={handleGridPointerDown}
              onPointerMove={handleGridPointerMove}
              onPointerUp={handleGridPointerUp}
              onPointerCancel={handleGridPointerCancel}
            >
              <div className="week-view-days-track">
                {WEEK_OFFSETS.map((weekOffset) => renderWeekColumns(weekOffset))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Calendar({ settingsOpen, onSettingsOpenChange }) {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today)
  const [viewedMonth, setViewedMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [view, setView] = useState('week')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [reverseScroll, setReverseScroll] = useState(loadReverseScrollSetting)

  const settingsVisible = settingsOpen ?? false
  const setSettingsVisible = onSettingsOpenChange ?? (() => {})

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
      <aside
        className={`month-sidebar${sidebarOpen ? ' month-sidebar-open' : ''}`}
        aria-hidden={!sidebarOpen}
      >
        <Sidebar
          viewedMonth={viewedMonth}
          selectedDate={selectedDate}
          today={today}
          eventDates={getMockEventDates(viewedMonth)}
          sidebarOpen={sidebarOpen}
          onDateSelect={handleDateSelect}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
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
      />
      {settingsVisible && (
        <SettingsPanel
          reverseScroll={reverseScroll}
          onReverseScrollChange={setReverseScroll}
          onClose={() => setSettingsVisible(false)}
        />
      )}
    </div>
  )
}
