import { useEffect, useRef, useState } from 'react'
import { openExternalUrl } from '../../lib/openExternalUrl'
import {
  MAX_SELECTION_LENGTH,
  MIN_SELECTION_LENGTH,
  buildCoupangSearchUrl,
  fetchNoteSuggestion,
} from './noteSuggestion'

const CHIP_GAP = 8
const CHIP_ESTIMATED_HEIGHT = 36

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
 * Floating AI action chip that appears next to a drag-selection in the note body.
 * Problem it solves: turn highlighted text into a one-click next action (e.g. Coupang search).
 */
export default function NoteSelectionSuggestion({ editorRef, noteId }) {
  const [anchor, setAnchor] = useState(null)
  const [status, setStatus] = useState('idle')
  const [suggestion, setSuggestion] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

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

  async function handleChipClick() {
    if (!suggestion || suggestion.action !== 'coupang_search') {
      return
    }
    await openExternalUrl(buildCoupangSearchUrl(suggestion.query))
    clearSuggestion()
  }

  if (!anchor || status === 'idle') {
    return null
  }

  const { top, left, transform } = anchor.position

  return (
    <div
      ref={chipRef}
      className="note-selection-suggestion"
      style={{ top, left, transform }}
      // Keep the text selection visible when interacting with the chip.
      onMouseDown={(event) => event.preventDefault()}
    >
      {status === 'loading' && (
        <span className="note-selection-suggestion-loading" aria-live="polite">
          생각 중…
        </span>
      )}

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
  )
}
