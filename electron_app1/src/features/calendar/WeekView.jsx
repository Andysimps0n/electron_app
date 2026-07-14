import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useCalendarEvents } from '../../hooks/useCalendarEvents'
import {
  addDays,
  DAY_LABELS,
  formatHour,
  getWeekDates,
  isSameDay,
} from '../../utils/dateUtils'
import {
  CELL_HEIGHT,
  clamp,
  dragTimeBlock,
  END_HOUR,
  EVENT_COLOR_KEYS,
  EVENT_COLORS,
  formatSelectionRange,
  getDateKey,
  getEventColorStyle,
  getRepeatOccurrenceDates,
  getScrollTopForCurrentTime,
  HORIZONTAL_SCROLL_DOMINANCE,
  HORIZONTAL_SCROLL_LOCK_MS,
  HOURS,
  resizeSelection,
  SNAP_MINUTES,
  START_HOUR,
  WEEK_OFFSETS,
} from './calendarUtils'
import { TrashIcon } from '../../shared/icons'

export default function WeekView({
  selectedDate,
  today,
  reverseScroll,
  onWeekChange,
}) {
  const daysBodyViewportRef = useRef(null)
  const gridWrapperRef = useRef(null)
  const weekViewRef = useRef(null)
  const eventEditorRef = useRef(null)
  const interactionRef = useRef(null)
  const clipboardEventRef = useRef(null)
  const selectedDateRef = useRef(selectedDate)
  const weekScrollOffsetRef = useRef(0)
  const reverseScrollRef = useRef(reverseScroll)
  const horizontalScrollLockTimerRef = useRef(null)
  const horizontalScrollLockedTimerRef = useRef(null)
  const verticalScrollLockedRef = useRef(false)
  const horizontalScrollLockedRef = useRef(false)
  selectedDateRef.current = selectedDate
  reverseScrollRef.current = reverseScroll
  const weekDates = getWeekDates(selectedDate)
  const [draftSelection, setDraftSelection] = useState(null)
  const [editorSelection, setEditorSelection] = useState(null)
  const [editingEventId, setEditingEventId] = useState(null)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDetails, setEventDetails] = useState('')
  const [eventColor, setEventColor] = useState(null)
  const [eventRepeat, setEventRepeat] = useState('none')
  const [eventRepeatInterval, setEventRepeatInterval] = useState(1)
  const [eventRepeatUnit, setEventRepeatUnit] = useState('day')
  const [editorFlipY, setEditorFlipY] = useState(false)
  const { events, createEvents, updateEvent, deleteEvent } = useCalendarEvents()
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

  useLayoutEffect(() => {
    if (!editorSelection) {
      setEditorFlipY(false)
      return
    }

    const editor = eventEditorRef.current
    if (!editor) {
      return
    }

    const selectionTop =
      ((editorSelection.startMinute - START_HOUR * 60) / 60) * CELL_HEIGHT
    const gridHeight = (END_HOUR - START_HOUR) * CELL_HEIGHT
    setEditorFlipY(selectionTop + editor.offsetHeight > gridHeight)
  }, [editorSelection, eventTitle, eventDetails, editingEventId])

  function getScrollDelta(rawDelta) {
    return reverseScrollRef.current ? rawDelta : -rawDelta
  }

  function lockVerticalScroll() {
    horizontalScrollLockedRef.current = false
    window.clearTimeout(horizontalScrollLockedTimerRef.current)
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

  function lockHorizontalScroll() {
    verticalScrollLockedRef.current = false
    setVerticalScrollLocked(false)
    window.clearTimeout(horizontalScrollLockTimerRef.current)
    horizontalScrollLockedRef.current = true
    window.clearTimeout(horizontalScrollLockedTimerRef.current)
    horizontalScrollLockedTimerRef.current = window.setTimeout(() => {
      horizontalScrollLockedRef.current = false
    }, HORIZONTAL_SCROLL_LOCK_MS)
  }

  function unlockHorizontalScroll() {
    window.clearTimeout(horizontalScrollLockedTimerRef.current)
    horizontalScrollLockedRef.current = false
  }

  useEffect(() => {
    return () => {
      window.clearTimeout(horizontalScrollLockTimerRef.current)
      window.clearTimeout(horizontalScrollLockedTimerRef.current)
    }
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
    setEventDetails('')
    setEventColor(null)
    setEventRepeat('none')
    setEventRepeatInterval(1)
    setEventRepeatUnit('day')
  }

  function clearEventSelection() {
    setSelectedEventId(null)
  }

  function selectEvent(calendarEvent) {
    setSelectedEventId(calendarEvent.id)
    dismissEditor()
  }

  function handleDeleteEvent() {
    // Prefer the event being edited; otherwise delete the clicked/selected one.
    const eventId = editingEventId ?? selectedEventId
    if (!eventId) {
      return
    }

    deleteEvent(eventId)
    clearEventSelection()
    dismissEditor()
  }

  function openEventEditor(calendarEvent) {
    setSelectedEventId(calendarEvent.id)
    setEditingEventId(calendarEvent.id)
    setEditorSelection({
      dayIndex: calendarEvent.dayIndex,
      startMinute: calendarEvent.startMinute,
      endMinute: calendarEvent.endMinute,
    })
    setEventTitle(calendarEvent.title)
    setEventDetails(calendarEvent.details ?? '')
    setEventColor(calendarEvent.color ?? null)
    setEventRepeat('none')
    setEventRepeatInterval(1)
    setEventRepeatUnit('day')
    setDraftSelection(null)
  }

  function copySelectedEvent() {
    if (editingEventId && editorSelection) {
      clipboardEventRef.current = {
        title: eventTitle.trim() || '새 일정',
        details: eventDetails,
        color: eventColor,
        startMinute: editorSelection.startMinute,
        endMinute: editorSelection.endMinute,
      }
      return
    }

    const eventId = selectedEventId
    if (!eventId) {
      return
    }

    const calendarEvent = events.find((event) => event.id === eventId)
    if (!calendarEvent) {
      return
    }

    clipboardEventRef.current = {
      title: calendarEvent.title,
      details: calendarEvent.details ?? '',
      color: calendarEvent.color ?? null,
      startMinute: calendarEvent.startMinute,
      endMinute: calendarEvent.endMinute,
    }
  }

  function pasteClipboardEvent() {
    const snapshot = clipboardEventRef.current
    if (!snapshot) {
      return
    }

    const newId = crypto.randomUUID()
    createEvents([
      {
        id: newId,
        dateKey: getDateKey(selectedDate),
        dayIndex: selectedDate.getDay(),
        startMinute: snapshot.startMinute,
        endMinute: snapshot.endMinute,
        title: snapshot.title,
        details: snapshot.details,
        color: snapshot.color,
      },
    ])
    dismissEditor()
    setSelectedEventId(newId)
  }

  function navigateWeek(dayDelta) {
    resetWeekScroll()
    onWeekChange(addDays(selectedDate, dayDelta))
  }

  function applyWeekScrollDelta(rawDelta) {
    if (horizontalScrollLockedRef.current) {
      return
    }

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

    if (weekDelta !== 0) {
      onWeekChange(addDays(selectedDateRef.current, weekDelta))
      dismissEditor()
      next = 0
    }

    weekScrollOffsetRef.current = next
    setWeekScrollOffset(next)
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

      if (horizontalScrollLockedRef.current) {
        if (absX > 0 && absX > absY * HORIZONTAL_SCROLL_DOMINANCE) {
          event.preventDefault()
          lockHorizontalScroll()
          return
        }

        if (absY > 0) {
          lockHorizontalScroll()
        }
        return
      }

      if (absX === 0 || absX <= absY * HORIZONTAL_SCROLL_DOMINANCE) {
        if (absY > 0) {
          lockHorizontalScroll()
        }
        return
      }

      event.preventDefault()
      lockVerticalScroll()
      applyWeekScrollDelta(deltaX)
    }

    function handleScroll() {
      lockHorizontalScroll()
    }

    wrapper.addEventListener('wheel', handleWheel, { passive: false })
    wrapper.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      wrapper.removeEventListener('wheel', handleWheel)
      wrapper.removeEventListener('scroll', handleScroll)
    }
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
      clearEventSelection()
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

  // Delete/Backspace removes the selected or editing event.
  // Runs even when the editor is closed (click-to-select only).
  useEffect(() => {
    if (!selectedEventId && !editingEventId) {
      return
    }

    function handleDeleteKeyDown(event) {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return
      }

      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        // While typing in the editor, only delete the event if the field is empty.
        if (target.value !== '') {
          return
        }
      }

      event.preventDefault()
      handleDeleteEvent()
    }

    document.addEventListener('keydown', handleDeleteKeyDown)
    return () => {
      document.removeEventListener('keydown', handleDeleteKeyDown)
    }
  }, [selectedEventId, editingEventId])

  useEffect(() => {
    function handleCopyPasteKeyDown(event) {
      const mod = event.metaKey || event.ctrlKey
      if (!mod) {
        return
      }

      const inInput =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement

      if (inInput) {
        return
      }

      if (event.key === 'c' || event.key === 'C') {
        event.preventDefault()
        copySelectedEvent()
        return
      }

      if (event.key === 'v' || event.key === 'V') {
        event.preventDefault()
        pasteClipboardEvent()
      }
    }

    document.addEventListener('keydown', handleCopyPasteKeyDown)
    return () => {
      document.removeEventListener('keydown', handleCopyPasteKeyDown)
    }
  }, [
    editingEventId,
    editorSelection,
    selectedEventId,
    eventTitle,
    eventDetails,
    eventColor,
    events,
    selectedDate,
  ])

  function getPointerSlot(event, { currentWeekOnly = false } = {}) {
    const viewport = daysBodyViewportRef.current
    if (!viewport) {
      return null
    }

    const viewportRect = viewport.getBoundingClientRect()
    const y = event.clientY - viewportRect.top

    if (y < 0) {
      return null
    }

    const track = viewport.querySelector('.week-view-days-track')
    if (!track) {
      return null
    }

    let dayIndex = null
    let weekOffset = 0

    // Prefer the center week panel so partial horizontal scroll does not
    // mis-detect adjacent weeks during vertical drag interactions.
    const panelSearchOrder = currentWeekOnly ? [1, 2, 0] : [1, 0, 2]

    for (const panelIndex of panelSearchOrder) {
      const panel = track.children[panelIndex]
      if (!panel) {
        continue
      }

      const columns = panel.querySelectorAll(':scope > .week-view-day-column')

      for (let index = 0; index < columns.length; index++) {
        const rect = columns[index].getBoundingClientRect()

        if (
          event.clientX >= rect.left &&
          event.clientX < rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        ) {
          dayIndex = index
          weekOffset = WEEK_OFFSETS[panelIndex] ?? 0
          break
        }
      }

      if (dayIndex != null) {
        break
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
      weekOffset,
      x: event.clientX - viewportRect.left,
      y,
    }
  }

  function getCurrentWeekPointerSlot(event) {
    return getPointerSlot(event, { currentWeekOnly: true })
  }

  function resolvePointerSlot(event) {
    const slot = getPointerSlot(event)
    if (!slot) {
      return null
    }

    if (slot.weekOffset === 0) {
      return slot
    }

    onWeekChange(addDays(selectedDateRef.current, slot.weekOffset * 7))
    resetWeekScroll()
    return { ...slot, weekOffset: 0 }
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

  function getEventStyle(event) {
    const colorKey =
      editingEventId === event.id ? eventColor : event.color

    return {
      '--selection-top': `${
        ((event.startMinute - START_HOUR * 60) / 60) * CELL_HEIGHT
      }px`,
      '--selection-height': `${
        ((event.endMinute - event.startMinute) / 60) * CELL_HEIGHT
      }px`,
      ...getEventColorStyle(colorKey),
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
      selection.dayIndex > 3 && 'event-editor-flip-x',
      editorFlipY && 'event-editor-flip-y',
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

    clearEventSelection()

    const startSlot = resolvePointerSlot(event)
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
      const currentSlot = getCurrentWeekPointerSlot(event)
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

      updateEvent(interaction.eventId, nextSelection)
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
        lockHorizontalScroll()
      }

      const currentSlot = resolvePointerSlot(event)
      if (!currentSlot) {
        return
      }

      const nextBlock = dragTimeBlock(
        interaction.original,
        interaction.startSlot,
        currentSlot,
      )

      if (interaction.mode === 'drag-event') {
        updateEvent(interaction.calendarEvent.id, {
          ...nextBlock,
          dateKey: getDateKey(weekDates[nextBlock.dayIndex]),
        })

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
    const verticalSelectIntent =
      interaction.mode === 'selecting' ||
      (interaction.mode === 'pending' &&
        Math.abs(dy) > 4 &&
        Math.abs(dy) >= Math.abs(dx))

    if (
      !verticalSelectIntent &&
      !horizontalScrollLockedRef.current &&
      (interaction.mode === 'week-scroll' ||
        (interaction.mode === 'pending' &&
          Math.abs(dx) > 8 &&
          Math.abs(dx) > Math.abs(dy) * HORIZONTAL_SCROLL_DOMINANCE))
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

    const currentSlot = getCurrentWeekPointerSlot(event)
    if (!currentSlot || currentSlot.dayIndex !== interaction.startSlot.dayIndex) {
      return
    }

    if (Math.abs(dy) > 4 || interaction.mode === 'selecting') {
      interaction.mode = 'selecting'
      lockHorizontalScroll()
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

    unlockHorizontalScroll()

    if (
      interaction.mode === 'resize-selection' ||
      interaction.mode === 'resize-event'
    ) {
      interactionRef.current = null
      return
    }

    if (interaction.mode === 'pending-event-drag') {
      const calendarEvent = interaction.calendarEvent
      if (
        selectedEventId === calendarEvent.id &&
        editingEventId !== calendarEvent.id
      ) {
        openEventEditor(calendarEvent)
      } else {
        selectEvent(calendarEvent)
      }
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

    const endSlot = resolvePointerSlot(event) ?? interaction.startSlot
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
    unlockHorizontalScroll()
  }

  function handleResizeSelectionPointerDown(event, edge, selection) {
    if (event.button !== 0) {
      return
    }

    event.stopPropagation()
    daysBodyViewportRef.current.setPointerCapture(event.pointerId)
    lockHorizontalScroll()
    interactionRef.current = {
      mode: 'resize-selection',
      pointerId: event.pointerId,
      edge,
      selection,
    }
  }

  function handleEventPointerDown(pointerEvent, calendarEvent) {
    if (pointerEvent.button !== 0) {
      return
    }

    if (pointerEvent.target.closest('.week-view-resize-handle')) {
      return
    }

    pointerEvent.stopPropagation()
    const startSlot = resolvePointerSlot(pointerEvent)
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
    if (event.button !== 0) {
      return
    }

    if (event.target.closest('.week-view-resize-handle')) {
      return
    }

    event.stopPropagation()
    const startSlot = resolvePointerSlot(event)
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
    if (event.button !== 0) {
      return
    }

    event.stopPropagation()
    daysBodyViewportRef.current.setPointerCapture(event.pointerId)
    lockHorizontalScroll()
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
    const startMinute = clamp(snappedStart, START_HOUR * 60, END_HOUR * 60 - 60)
    const selection = {
      dayIndex: dayIndex >= 0 ? dayIndex : 0,
      startMinute,
      endMinute: startMinute + 60,
    }

    setDraftSelection(selection)
    setEditorSelection(selection)
    setEditingEventId(null)
    setEventTitle('')
    setEventDetails('')
    setEventColor(null)
    setEventRepeat('none')
    setEventRepeatInterval(1)
    setEventRepeatUnit('day')
  }

  function handleSaveEvent() {
    if (!editorSelection) {
      return
    }

    const title = eventTitle.trim() || '새 일정'
    const details = eventDetails.trim()

    if (editingEventId) {
      updateEvent(editingEventId, {
        title,
        details,
        color: eventColor,
        dayIndex: editorSelection.dayIndex,
        startMinute: editorSelection.startMinute,
        endMinute: editorSelection.endMinute,
        dateKey: getDateKey(weekDates[editorSelection.dayIndex]),
      })
    } else {
      const startDate = weekDates[editorSelection.dayIndex]
      const occurrenceDates = getRepeatOccurrenceDates(startDate, {
        repeat: eventRepeat,
        interval: eventRepeatInterval,
        unit: eventRepeatUnit,
      })

      createEvents(
        occurrenceDates.map((date) => ({
          id: crypto.randomUUID(),
          dateKey: getDateKey(date),
          title,
          details,
          color: eventColor,
          dayIndex: date.getDay(),
          startMinute: editorSelection.startMinute,
          endMinute: editorSelection.endMinute,
        })),
      )
    }

    dismissEditor()
  }

  const visibleSelection = editingEventId ? draftSelection : editorSelection ?? draftSelection
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
                  }${
                    selectedEventId === event.id && editingEventId !== event.id
                      ? ' week-view-event-selected'
                      : ''
                  }`}
                  style={getEventStyle(event)}
                  onPointerDown={(pointerEvent) =>
                    handleEventPointerDown(pointerEvent, event)
                  }
                  onDoubleClick={(pointerEvent) => {
                    pointerEvent.stopPropagation()
                    openEventEditor(event)
                  }}
                  onContextMenu={(pointerEvent) => {
                    pointerEvent.preventDefault()
                    pointerEvent.stopPropagation()
                    openEventEditor(event)
                  }}
                >
                  <strong>{event.title}</strong>
                  <span>
                    {event.details?.trim() || formatSelectionRange(event)}
                  </span>
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
            style={{
              ...getSelectionStyle(visibleSelection),
              ...getEventColorStyle(eventColor),
            }}
            onPointerDown={(event) =>
              handleSelectionPointerDown(event, visibleSelection)
            }
          >
            <strong>{eventTitle.trim() || '새 일정'}</strong>
            <span>
              {eventDetails.trim() || formatSelectionRange(visibleSelection)}
            </span>
          </div>
        )}

        {weekOffset === 0 && editorSelection && (
          <form
            ref={eventEditorRef}
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
                <h2>{editingEventId ? '일정 수정' : '일정 만들기'}</h2>
                <p>{formatSelectionRange(editorSelection)}</p>
              </div>
            </div>
            <label className="event-editor-field">
              <span>이름</span>
              <input
                autoFocus={!editingEventId}
                value={eventTitle}
                placeholder="새 일정"
                onChange={(event) => setEventTitle(event.target.value)}
              />
            </label>
            <div className="event-editor-field">
              <span>시간</span>
              <strong>{formatSelectionRange(editorSelection)}</strong>
            </div>
            <label className="event-editor-field">
              <span>메모</span>
              <input
                value={eventDetails}
                placeholder="메모, URL 또는 세부 정보"
                onChange={(event) => setEventDetails(event.target.value)}
              />
            </label>
            <label className="event-editor-field">
              <span>반복</span>
              <select
                value={eventRepeat}
                onChange={(event) => setEventRepeat(event.target.value)}
              >
                <option value="none">안 함</option>
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
                <option value="custom">사용자지정</option>
              </select>
            </label>
            {eventRepeat === 'custom' && (
              <label className="event-editor-field event-editor-repeat-custom">
                <span>간격</span>
                <div className="event-editor-repeat-interval">
                  <span className="event-editor-repeat-prefix">매</span>
                  <input
                    type="number"
                    min={1}
                    value={eventRepeatInterval}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value)
                      setEventRepeatInterval(
                        Number.isFinite(nextValue) && nextValue >= 1
                          ? nextValue
                          : 1,
                      )
                    }}
                  />
                  <select
                    value={eventRepeatUnit}
                    onChange={(event) => setEventRepeatUnit(event.target.value)}
                  >
                    <option value="day">일마다</option>
                    <option value="week">주마다</option>
                  </select>
                </div>
              </label>
            )}

            <div className="event-editor-actions">
              <div
                className="event-editor-color-swatches"
                role="group"
                aria-label="일정 색상"
              >
                {EVENT_COLOR_KEYS.map((colorKey) => (
                  <button
                    key={colorKey}
                    type="button"
                    className={`event-editor-color-swatch${
                      eventColor === colorKey
                        ? ' event-editor-color-swatch-selected'
                        : ''
                    }`}
                    style={{ background: EVENT_COLORS[colorKey].solid }}
                    aria-label={EVENT_COLORS[colorKey].label}
                    aria-pressed={eventColor === colorKey}
                    onClick={() => setEventColor(colorKey)}
                  />
                ))}
              </div>
              <div className="event-editor-action-buttons">
                {editingEventId && (
                  <button
                    type="button"
                    className="event-editor-delete-btn"
                    aria-label="일정 삭제"
                    onClick={handleDeleteEvent}
                  >
                    <TrashIcon />
                  </button>
                )}
                <button
                  type="button"
                  className="event-editor-ghost-btn"
                  onClick={dismissEditor}
                >
                  취소
                </button>
                <button type="submit" className="event-editor-save-btn">
                  저장
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="week-view" ref={weekViewRef}>
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
