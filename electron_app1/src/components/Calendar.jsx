import { useEffect, useRef, useState } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PanelIcon,
} from './icons'
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

const TODOS_STORAGE_KEY = 'calendar-todos'

function createTodo(text, timeMinute = null) {
  return {
    id: crypto.randomUUID(),
    text,
    done: false,
    timeMinute,
    createdAt: Date.now(),
  }
}

function getDefaultTodos() {
  return [
    createTodo('Review quarterly report', 9 * 60),
    createTodo('Sync with design team', 11 * 60 + 30),
    createTodo('Prepare sprint presentation', 14 * 60),
  ]
}

function loadTodos() {
  try {
    const stored = localStorage.getItem(TODOS_STORAGE_KEY)
    if (stored === null) {
      return getDefaultTodos()
    }

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
  } catch {
    return []
  }
}

function SidebarTodoList({ todos, onAddTodo, onToggleTodo, onDeleteTodo }) {
  const [draft, setDraft] = useState('')

  function commitDraft(text) {
    const trimmed = text.trim()
    if (!trimmed) {
      return
    }

    onAddTodo(trimmed)
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }

    event.preventDefault()
    commitDraft(draft)
    setDraft('')
  }

  function handlePaste(event) {
    const pasted = event.clipboardData.getData('text')
    if (!pasted.includes('\n')) {
      return
    }

    event.preventDefault()
    pasted
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => onAddTodo(line))
    setDraft('')
  }

  return (
    <section className="sidebar-todos">
      <h3 className="sidebar-todos__title">Upcoming Tasks</h3>

      {todos.length > 0 && (
        <ul className="sidebar-todos__list">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`sidebar-todos__item${
                todo.done ? ' sidebar-todos__item--done' : ''
              }`}
            >
              <label className="sidebar-todos__check">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => onToggleTodo(todo.id)}
                  aria-label={`Mark "${todo.text}" as ${
                    todo.done ? 'incomplete' : 'complete'
                  }`}
                />
                <span className="sidebar-todos__checkmark" />
              </label>
              <div className="sidebar-todos__content">
                <span className="sidebar-todos__text">{todo.text}</span>
                {todo.timeMinute != null && (
                  <span className="sidebar-todos__time">
                    {formatMinutes(todo.timeMinute)}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="sidebar-todos__delete-btn"
                aria-label={`Delete "${todo.text}"`}
                onClick={() => onDeleteTodo(todo.id)}
              >
                ×
              </button>
            </li>
          ))}
                <textarea
        className={`sidebar-todos__empty${
          todos.length === 0 ? ' sidebar-todos__empty--solo' : ''
        }`}
        placeholder="Add a task..."
        value={draft}
        rows={todos.length > 0 ? 1 : 4}
        aria-label="Add tasks"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
        </ul>
      )}
    </section>
  )
}

function Sidebar({
  viewedMonth,
  selectedDate,
  today,
  eventDates,
  todos,
  sidebarOpen,
  onMonthChange,
  onDateSelect,
  onToggleSidebar,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}) {
  const cells = getMonthGrid(viewedMonth.getFullYear(), viewedMonth.getMonth())

  return (
    <aside className="sidebar">
      <div className="sidebar__month">
        <div className="sidebar__header">
          <h2 className="sidebar__title">{formatMonthYear(viewedMonth)}</h2>
          <button
            type="button"
            className="sidebar__panel-toggle"
            aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            aria-pressed={sidebarOpen}
            onClick={onToggleSidebar}
          >
            <PanelIcon />
          </button>
        </div>

        <div className="sidebar__grid">
          {DAY_LABELS.map((label) => (
            <span key={label} className="sidebar__day-label">
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
      </div>

      <SidebarTodoList
        todos={todos}
        onAddTodo={onAddTodo}
        onToggleTodo={onToggleTodo}
        onDeleteTodo={onDeleteTodo}
      />
    </aside>
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

      if (event.target.closest('.week-view__event')) {
        return
      }

      if (event.target.closest('.week-view__selection')) {
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

    if (event.target.closest('.week-view__event')) {
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
    if (pointerEvent.target.closest('.week-view__resize-handle')) {
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
    if (event.target.closest('.week-view__resize-handle')) {
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
        {dates.map((date) => {
          const isToday = isSameDay(date, today)
          return (
            <div
              key={date.toISOString()}
              className={`week-view__day-column${
                isToday ? ' week-view__day-column--today' : ''
              }`}
            >
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
                  className={`week-view__event${
                    editingEventId === event.id ? ' week-view__event--editing' : ''
                  }`}
                  style={getSelectionStyle(event)}
                  onPointerDown={(pointerEvent) =>
                    handleEventPointerDown(pointerEvent, event)
                  }
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
          )
        })}

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
            onPointerDown={(event) =>
              handleSelectionPointerDown(event, visibleSelection)
            }
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
              <div>
                <h2>{editingEventId ? 'Edit event' : 'Create event'}</h2>
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
    <div className="week-view" ref={weekViewRef}>
      <header className="week-view__header">
        <div className="week-view__week-picker">
          {!sidebarOpen && (
            <button
              type="button"
              className="week-view__sidebar-reopen"
              aria-label="Show sidebar"
              onClick={onToggleSidebar}
            >
              <PanelIcon />
            </button>
          )}
          <div className="week-view__week-picker-inner">
          <button
            type="button"
            className="week-view__week-picker-btn"
            aria-label="Previous week"
            onClick={() => navigateWeek(-7)}
          >
            <ChevronLeftIcon />
          </button>
          <span className="week-view__week-label">
            Week {getWeekNumber(selectedDate)}
          </span>
          <button
            type="button"
            className="week-view__week-picker-btn"
            aria-label="Next week"
            onClick={() => navigateWeek(7)}
          >
            <ChevronRightIcon />
          </button>
          </div>
        </div>

        <div className="week-view__header-center">
          <div className="week-view__title-group">
            <h1 className="week-view__title">{formatMonthYearShort(selectedDate)}</h1>
          </div>
          <time
            className="week-view__clock"
            dateTime={now.toISOString()}
            aria-label={`Current time ${digitalClock.hours}:${digitalClock.minutes} ${digitalClock.period}`}
          >
            <span className="week-view__clock-digit">{digitalClock.hours}</span>
            <span className="week-view__clock-separator" aria-hidden="true">
              :
            </span>
            <span className="week-view__clock-digit">{digitalClock.minutes}</span>
            <span className="week-view__clock-period">{digitalClock.period}</span>
          </time>
        </div>

        <div className="week-view__header-actions">
          <button
            type="button"
            className="week-view__new-event-btn"
            onClick={handleNewEvent}
          >
            + New Event
          </button>
        </div>
      </header>

      <div
        className={`week-view__grid-wrapper${verticalScrollLocked ? ' week-view__grid-wrapper--lock-y' : ''}`}
        ref={gridWrapperRef}
      >
        <div className="week-view__grid">
          <div className="week-view__corner">GMT +1</div>

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

export default function Calendar({ settingsOpen, onSettingsOpenChange }) {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today)
  const [viewedMonth, setViewedMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [view, setView] = useState('week')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [reverseScroll, setReverseScroll] = useState(loadReverseScrollSetting)
  const [todos, setTodos] = useState(loadTodos)

  const settingsVisible = settingsOpen ?? false
  const setSettingsVisible = onSettingsOpenChange ?? (() => {})

  useEffect(() => {
    localStorage.setItem('reverseScroll', String(reverseScroll))
  }, [reverseScroll])

  useEffect(() => {
    localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  function handleAddTodo(text) {
    const currentTime = new Date()
    const timeMinute = currentTime.getHours() * 60 + currentTime.getMinutes()
    setTodos((current) => [createTodo(text, timeMinute), ...current])
  }

  function handleToggleTodo(id) {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo,
      ),
    )
  }

  function handleDeleteTodo(id) {
    setTodos((current) => current.filter((todo) => todo.id !== id))
  }

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
        className={`month-sidebar${sidebarOpen ? ' month-sidebar--open' : ''}`}
        aria-hidden={!sidebarOpen}
      >
        <Sidebar
          viewedMonth={viewedMonth}
          selectedDate={selectedDate}
          today={today}
          eventDates={getMockEventDates(viewedMonth)}
          todos={todos}
          sidebarOpen={sidebarOpen}
          onDateSelect={handleDateSelect}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onAddTodo={handleAddTodo}
          onToggleTodo={handleToggleTodo}
          onDeleteTodo={handleDeleteTodo}
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
