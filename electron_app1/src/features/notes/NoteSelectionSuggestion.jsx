import { useEffect, useRef, useState } from 'react'
import { openExternalUrl } from '../../lib/openExternalUrl'
import { useCalendarEvents } from '../../hooks/useCalendarEvents'
import {
  END_HOUR,
  SNAP_MINUTES,
  getDateKey,
} from '../calendar/calendarUtils'
import {
  MAX_SELECTION_LENGTH,
  MIN_SELECTION_LENGTH,
  buildCoupangSearchUrl,
  fetchNoteSuggestion,
  parseTimeToMinutes,
} from './noteSuggestion'

const CHIP_GAP = 8
const CHIP_ESTIMATED_HEIGHT = 36
/** Default length for events created from a note selection chip. */
const DEFAULT_EVENT_DURATION_MINUTES = 60
const CALENDAR_TOAST_MS = 5000

function readEditorSelection(editor) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null
  }

  const range = selection.getRangeAt(0)
  const common = range.commonAncestorContainer
  const node = common.nodeType === Node.TEXT_NODE ? common.parentNode : common
  if (!editor.contains(node)) {
    return null
  }

  const text = selection.toString().replace(/\s+/g, ' ').trim()
  if (text.length < MIN_SELECTION_LENGTH) {
    return null
  }

  return {
    text: text.slice(0, MAX_SELECTION_LENGTH),
    rect: range.getBoundingClientRect(),
  }
}

function positionForRect(rect) {
  const viewportPadding = 8
  const spaceAbove = rect.top
  const placeAbove = spaceAbove >= CHIP_ESTIMATED_HEIGHT + CHIP_GAP

  let top = placeAbove
    ? rect.top - CHIP_GAP
    : rect.bottom + CHIP_GAP
  // When placing above, CSS translateY(-100%) shifts the chip up.
  const transform = placeAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'

  let left = rect.left + rect.width / 2
  left = Math.min(
    Math.max(left, viewportPadding + 60),
    window.innerWidth - viewportPadding - 60,
  )

  if (!placeAbove) {
    top = Math.min(top, window.innerHeight - viewportPadding - CHIP_ESTIMATED_HEIGHT)
  } else {
    top = Math.max(top, viewportPadding + CHIP_ESTIMATED_HEIGHT)
  }

  return { top, left, transform }
}

/**
 * Floating action chip next to a text selection in the note body.
 * Shopping → Coupang search; schedule-like text → create a calendar event.
 */
export default function NoteSelectionSuggestion({
  editorRef,
  noteId,
  onOpenView,
}) {
  const [anchor, setAnchor] = useState(null)
  const [status, setStatus] = useState('idle')
  const [suggestion, setSuggestion] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [showCalendarToast, setShowCalendarToast] = useState(false)
  const { createEvent } = useCalendarEvents()

  const abortRef = useRef(null)
  const cacheRef = useRef(new Map())
  const chipRef = useRef(null)

  function clearSuggestion() {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setAnchor(null)
    setStatus('idle')
    setSuggestion(null)
    setErrorMessage('')
  }

  useEffect(() => {
    if (!showCalendarToast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setShowCalendarToast(false)
    }, CALENDAR_TOAST_MS)
    return () => window.clearTimeout(timeoutId)
  }, [showCalendarToast])

  async function runFetch(selected) {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }

    setAnchor({
      text: selected.text,
      position: positionForRect(selected.rect),
    })
    setSuggestion(null)
    setErrorMessage('')
    setStatus('loading')

    const cached = cacheRef.current.get(selected.text)
    if (cached !== undefined) {
      if (cached) {
        setSuggestion(cached)
        setStatus('ready')
      } else {
        clearSuggestion()
      }
      return
    }

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const result = await fetchNoteSuggestion(selected.text, {
        signal: controller.signal,
      })
      if (controller.signal.aborted) {
        return
      }

      cacheRef.current.set(selected.text, result)

      if (!result) {
        clearSuggestion()
        return
      }

      setSuggestion(result)
      setStatus('ready')
    } catch (error) {
      if (error?.name === 'AbortError') {
        return
      }
      setStatus('error')
      setErrorMessage('제안할 수 없습니다')
      setTimeout(() => {
        setAnchor((current) => {
          if (current?.text === selected.text) {
            return null
          }
          return current
        })
        setStatus('idle')
        setErrorMessage('')
      }, 1200)
    }
  }

  useEffect(() => {
    clearSuggestion()
    cacheRef.current.clear()
  }, [noteId])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) {
      return
    }

    function handleMouseUp() {
      // Let the browser finish updating the selection after mouseup.
      requestAnimationFrame(() => {
        const selected = readEditorSelection(editor)
        if (!selected) {
          clearSuggestion()
          return
        }
        runFetch(selected)
      })
    }

    function handleKeyUp(event) {
      // Shift+arrow selections should also trigger the chip.
      if (!event.shiftKey && event.key !== 'Shift') {
        return
      }
      requestAnimationFrame(() => {
        const selected = readEditorSelection(editor)
        if (!selected) {
          clearSuggestion()
          return
        }
        runFetch(selected)
      })
    }

    function handleDocumentMouseDown(event) {
      if (chipRef.current?.contains(event.target)) {
        return
      }
      if (editor.contains(event.target)) {
        // New drag starting inside the editor — hide until mouseup.
        clearSuggestion()
        return
      }
      clearSuggestion()
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        clearSuggestion()
      }
    }

    function handleScrollOrResize() {
      const selected = readEditorSelection(editor)
      if (!selected) {
        clearSuggestion()
        return
      }
      setAnchor((current) => {
        if (!current) {
          return current
        }
        return {
          ...current,
          position: positionForRect(selected.rect),
        }
      })
    }

    editor.addEventListener('mouseup', handleMouseUp)
    editor.addEventListener('keyup', handleKeyUp)
    document.addEventListener('mousedown', handleDocumentMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      editor.removeEventListener('mouseup', handleMouseUp)
      editor.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('mousedown', handleDocumentMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [editorRef, noteId])

  function createEventFromSuggestion() {
    const startMinute = parseTimeToMinutes(suggestion.timeText)
    if (startMinute === null) {
      return false
    }

    // Snap to the calendar grid; default block is 1 hour, clamped so a late
    // start (e.g. 11:30pm) still ends at the day boundary.
    const snappedStart = Math.min(
      Math.round(startMinute / SNAP_MINUTES) * SNAP_MINUTES,
      END_HOUR * 60 - SNAP_MINUTES,
    )
    const endMinute = Math.min(
      snappedStart + DEFAULT_EVENT_DURATION_MINUTES,
      END_HOUR * 60,
    )

    const today = new Date()
    createEvent({
      id: crypto.randomUUID(),
      dateKey: getDateKey(today),
      dayIndex: today.getDay(),
      title: suggestion.title,
      details: '',
      color: null,
      startMinute: snappedStart,
      endMinute,
    })
    return true
  }

  async function handleChipClick() {
    if (!suggestion) {
      return
    }

    if (suggestion.action === 'coupang_search') {
      await openExternalUrl(buildCoupangSearchUrl(suggestion.query))
      clearSuggestion()
      return
    }

    if (suggestion.action === 'create_calendar_event') {
      const created = createEventFromSuggestion()
      if (!created) {
        setStatus('error')
        setErrorMessage('시간을 이해하지 못했어요')
        setTimeout(() => clearSuggestion(), 1200)
        return
      }
      clearSuggestion()
      setShowCalendarToast(true)
    }
  }

  function handleGoToCalendar() {
    setShowCalendarToast(false)
    onOpenView?.('calendar')
  }

  const { top, left, transform } = anchor?.position ?? {
    top: 0,
    left: 0,
    transform: 'none',
  }

  return (
    <>
      {anchor && status !== 'idle' && status !== 'loading' && (
        <div
          ref={chipRef}
          className="note-selection-suggestion"
          style={{ top, left, transform }}
          // Keep the text selection visible when interacting with the chip.
          onMouseDown={(event) => event.preventDefault()}
        >
          {status === 'error' && (
            <span className="note-selection-suggestion-error" aria-live="polite">
              {errorMessage}
            </span>
          )}

          {status === 'ready' && suggestion && (
            <button
              type="button"
              className="note-selection-suggestion-chip"
              onClick={handleChipClick}
            >
              {suggestion.label}
            </button>
          )}
        </div>
      )}

      {showCalendarToast && (
        <div className="notes-deleted-toast" role="status">
          <span>일정이 추가되었습니다.</span>
          <button type="button" onClick={handleGoToCalendar}>
            캘린더로 이동
          </button>
        </div>
      )}
    </>
  )
}
