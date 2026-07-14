import { useEffect, useRef, useState } from 'react'
import DigitalClock from '../../shared/DigitalClock'
import AuthButton from '../../shared/AuthButton'
import MusicMuteButton from '../../shared/MusicMuteButton'
import {
  BulletListIcon,
  ChecklistIcon,
  HighlightIcon,
  PanelIcon,
  TrashIcon,
} from '../../shared/icons'
import {
  getListItemAtSelection,
  handleListKeyDown,
  tryToggleChecklistItem,
} from '../../utils/noteListEditor'
import NoteSelectionSuggestion from './NoteSelectionSuggestion'
import '../../shared/sidebar.css'
import './notes.css'

const NOTES_STORAGE_KEY = 'notes'

function createNote() {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '',
    content: '',
    createdAt: now,
    updatedAt: now,
  }
}

function loadNotes() {
  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY)
    if (!stored) {
      return [createNote()]
    }

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createNote()]
    }

    // Older saves relied on re-sorting by createdAt at render time. Now the
    // array order itself is the display order, so normalize once on load:
    // start the manual order from the previous "newest first" ordering.
    return [...parsed].sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return [createNote()]
  }
}

function getNoteDisplayTitle(note) {
  const trimmed = note.title.trim()
  if (trimmed) {
    return trimmed
  }

  const plainText = note.content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (plainText) {
    return plainText.slice(0, 48) + (plainText.length > 48 ? '…' : '')
  }

  return '제목 없음'
}

function NotesSidebar({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onReorderNotes,
  showingDeletedNotes,
  onToggleDeletedNotes,
}) {
  // Which note is being dragged / hovered over, for visual feedback only.
  // The actual order lives in the parent's `notes` state.
  const [draggingNoteId, setDraggingNoteId] = useState(null)
  const [dragOverTarget, setDragOverTarget] = useState(null)
  // Some browsers fire a click right after a drop; use this flag to
  // avoid treating that click as a note selection.
  const justDraggedRef = useRef(false)

  function handleDragStart(event, noteId) {
    justDraggedRef.current = true
    setDraggingNoteId(noteId)
    event.dataTransfer.effectAllowed = 'move'
    // Firefox requires data to be set for the drag to start.
    event.dataTransfer.setData('text/plain', noteId)
  }

  function handleDragOver(event, noteId) {
    // preventDefault marks this element as a valid drop target.
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'

    const bounds = event.currentTarget.getBoundingClientRect()
    const placement =
      event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after'
    const nextTarget = { noteId, placement }

    if (
      noteId !== dragOverTarget?.noteId ||
      placement !== dragOverTarget.placement
    ) {
      setDragOverTarget(nextTarget)
    }
  }

  function handleDrop(event, targetNoteId) {
    event.preventDefault()
    const fromIndex = notes.findIndex((note) => note.id === draggingNoteId)
    const toIndex = notes.findIndex((note) => note.id === targetNoteId)

    if (fromIndex !== -1 && toIndex !== -1) {
      const insertAt =
        dragOverTarget?.placement === 'after' ? toIndex + 1 : toIndex
      onReorderNotes(fromIndex, insertAt)
    }
  }

  function handleDragEnd() {
    setDraggingNoteId(null)
    setDragOverTarget(null)
    // Clear the flag after the current event turn so a stray
    // click-after-drop is ignored, but the next real click works.
    window.setTimeout(() => {
      justDraggedRef.current = false
    }, 0)
  }

  function handleSelectNote(noteId) {
    if (justDraggedRef.current) {
      return
    }
    onSelectNote(noteId)
  }

  return (
    <aside className="sidebar notes-sidebar">
      <div className="notes-sidebar-header">
        <h2 className="sidebar-title">
          {showingDeletedNotes ? '삭제된 노트' : '노트'}
        </h2>
        <button
          type="button"
          className="notes-sidebar-new-btn"
          onClick={onCreateNote}
        >
          + 새 노트
        </button>
      </div>

      <ul className="notes-sidebar-list">
        {notes.length === 0 && (
          <li className="notes-sidebar-empty">
            {showingDeletedNotes ? '삭제된 노트가 없습니다.' : '노트가 없습니다.'}
          </li>
        )}
        {notes.map((note) => {
          const itemClasses = [
            'notes-sidebar-item',
            !showingDeletedNotes && note.id === activeNoteId
              ? 'notes-sidebar-item-active'
              : '',
            note.id === draggingNoteId ? 'notes-sidebar-item-dragging' : '',
            showingDeletedNotes ? 'notes-sidebar-item-deleted' : '',
          ]
            .filter(Boolean)
            .join(' ')
          const listItemClasses = [
            !showingDeletedNotes &&
            dragOverTarget?.noteId === note.id &&
            note.id !== draggingNoteId
              ? `notes-sidebar-drop-${dragOverTarget.placement}`
              : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <li
              key={note.id}
              className={listItemClasses}
              draggable={!showingDeletedNotes}
              onDragStart={
                showingDeletedNotes
                  ? undefined
                  : (event) => handleDragStart(event, note.id)
              }
              onDragOver={
                showingDeletedNotes
                  ? undefined
                  : (event) => handleDragOver(event, note.id)
              }
              onDrop={
                showingDeletedNotes
                  ? undefined
                  : (event) => handleDrop(event, note.id)
              }
              onDragEnd={showingDeletedNotes ? undefined : handleDragEnd}
            >
              <button
                type="button"
                className={itemClasses}
                disabled={showingDeletedNotes}
                onClick={
                  showingDeletedNotes
                    ? undefined
                    : () => handleSelectNote(note.id)
                }
              >
                <span className="notes-sidebar-item-title">
                  {getNoteDisplayTitle(note)}
                </span>
                <span className="notes-sidebar-item-date">
                  {new Date(note.createdAt).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="notes-sidebar-footer">
        <button
          type="button"
          className="notes-sidebar-deleted-btn"
          aria-label={showingDeletedNotes ? '노트 목록으로 돌아가기' : '삭제된 노트 보기'}
          onClick={onToggleDeletedNotes}
        >
          {showingDeletedNotes ? '돌아가기' : '삭제된 노트 보기'}
        </button>
      </div>
    </aside>
  )
}

// Toss blue50 (#e8f3ff) — the subtle informational background color.
const HIGHLIGHT_COLOR = '#e8f3ff'

function applyEditorCommand(editor, command, value, onContentChange) {
  editor.focus()
  document.execCommand(command, false, value ?? null)
  onContentChange(editor.innerHTML)
}

function toggleList(editor, onContentChange, checklist = false) {
  editor.focus()
  document.execCommand('insertUnorderedList')
  const listItem = getListItemAtSelection(editor)
  const list = listItem?.closest('ul')
  if (list) {
    list.classList.toggle('note-checklist', checklist)
  }
  onContentChange(editor.innerHTML)
}

function NoteFormatToolbar({ editorRef, onContentChange, onDeleteNote }) {
  function run(action) {
    const editor = editorRef.current
    if (!editor) {
      return
    }
    action(editor)
  }

  return (
    <div className="notes-format-toolbar" role="toolbar" aria-label="노트 서식">
      <div className="notes-format-group">
        <button
          type="button"
          className="notes-format-btn notes-format-btn-text"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            run((editor) =>
              applyEditorCommand(editor, 'formatBlock', 'h1', onContentChange),
            )
          }
        >
          제목
        </button>
        <button
          type="button"
          className="notes-format-btn notes-format-btn-text"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            run((editor) =>
              applyEditorCommand(editor, 'formatBlock', 'h2', onContentChange),
            )
          }
        >
          부제목
        </button>
        <button
          type="button"
          className="notes-format-btn notes-format-btn-text"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            run((editor) =>
              applyEditorCommand(editor, 'formatBlock', 'div', onContentChange),
            )
          }
        >
          본문
        </button>
      </div>

      <span className="notes-format-divider" aria-hidden="true" />

      <div className="notes-format-group">
        <button
          type="button"
          className="notes-format-btn notes-format-btn-icon"
          aria-label="굵게"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            run((editor) =>
              applyEditorCommand(editor, 'bold', null, onContentChange),
            )
          }
        >
          B
        </button>
        <button
          type="button"
          className="notes-format-btn notes-format-btn-icon"
          aria-label="하이라이트"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            run((editor) =>
              applyEditorCommand(
                editor,
                'hiliteColor',
                HIGHLIGHT_COLOR,
                onContentChange,
              ),
            )
          }
        >
          <HighlightIcon />
        </button>
      </div>

      <span className="notes-format-divider" aria-hidden="true" />

      <div className="notes-format-group">
        <button
          type="button"
          className="notes-format-btn notes-format-btn-icon"
          aria-label="체크리스트"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            run((editor) => toggleList(editor, onContentChange, true))
          }
        >
          <ChecklistIcon />
        </button>
        <button
          type="button"
          className="notes-format-btn notes-format-btn-icon"
          aria-label="글머리 기호 목록"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            run((editor) => toggleList(editor, onContentChange, false))
          }
        >
          <BulletListIcon />
        </button>
      </div>

      <span className="notes-format-divider" aria-hidden="true" />

      <div className="notes-format-group">
        <button
          type="button"
          className="notes-format-btn notes-format-btn-icon"
          aria-label="노트 삭제"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onDeleteNote}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

function NoteEditor({
  note,
  onTitleChange,
  onContentChange,
  onDeleteNote,
  onOpenView,
}) {
  const editorRef = useRef(null)
  // Same Hangul IME pattern as TodoList: keep "composing" true until after
  // the current event turn so a confirm-Enter is not treated as a new bullet.
  const isComposingRef = useRef(false)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || editor.innerHTML === note.content) {
      return
    }

    editor.innerHTML = note.content
  }, [note.id, note.content])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) {
      return
    }

    function handleCompositionStart() {
      isComposingRef.current = true
    }

    function handleCompositionEnd() {
      window.setTimeout(() => {
        isComposingRef.current = false
      }, 0)
    }

    function handleKeyDown(event) {
      if (
        handleListKeyDown(editor, event, {
          isComposing: isComposingRef.current,
        })
      ) {
        onContentChange(editor.innerHTML)
        return
      }

      if (!event.altKey) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === 'b') {
        event.preventDefault()
        document.execCommand('bold')
        onContentChange(editor.innerHTML)
        return
      }

      if (key === 't') {
        event.preventDefault()
        document.execCommand('formatBlock', false, 'h2')
        onContentChange(editor.innerHTML)
      }
    }

    editor.addEventListener('compositionstart', handleCompositionStart)
    editor.addEventListener('compositionend', handleCompositionEnd)
    editor.addEventListener('keydown', handleKeyDown)
    return () => {
      editor.removeEventListener('compositionstart', handleCompositionStart)
      editor.removeEventListener('compositionend', handleCompositionEnd)
      editor.removeEventListener('keydown', handleKeyDown)
    }
  }, [note.id, onContentChange])

  function handleInput() {
    onContentChange(editorRef.current?.innerHTML ?? '')
  }

  function handleMouseDown(event) {
    const editor = editorRef.current
    if (!editor) {
      return
    }

    if (tryToggleChecklistItem(editor, event)) {
      onContentChange(editor.innerHTML)
    }
  }

  return (
    <div className="notes-editor-shell">
      <NoteFormatToolbar
        editorRef={editorRef}
        onContentChange={onContentChange}
        onDeleteNote={onDeleteNote}
      />

      <div className="note-editor">
        <input
          type="text"
          className="note-editor-title"
          placeholder="노트 제목"
          value={note.title}
          onChange={(event) => onTitleChange(event.target.value)}
        />

        <div
          ref={editorRef}
          className="note-editor-body"
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label="노트 내용"
          data-placeholder="작성을 시작하세요..."
          onInput={handleInput}
          onMouseDown={handleMouseDown}
          placeholder="작성을 시작하세요..."
          suppressContentEditableWarning
          spellCheck="false"
        />
      </div>

      <NoteSelectionSuggestion
        editorRef={editorRef}
        noteId={note.id}
        onOpenView={onOpenView}
      />
    </div>
  )
}

function DeletedNoteToast({ onUndo }) {
  return (
    <div className="notes-deleted-toast" role="status">
      <span>노트가 삭제되었습니다.</span>
      <button type="button" onClick={onUndo}>
        실행 취소
      </button>
    </div>
  )
}

export default function Notes({ defaultSidebarOpen = true, onOpenView }) {
  const [notes, setNotes] = useState(loadNotes)
  const [activeNoteId, setActiveNoteId] = useState(
    () => notes.find((note) => !note.deletedAt)?.id ?? null,
  )
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen)
  const [showingDeletedNotes, setShowingDeletedNotes] = useState(false)
  const [lastDeletedNoteId, setLastDeletedNoteId] = useState(null)

  const activeNotes = notes.filter((note) => !note.deletedAt)
  const deletedNotes = notes.filter((note) => note.deletedAt)
  const activeNote =
    activeNotes.find((note) => note.id === activeNoteId) ?? activeNotes[0]
  const sidebarNotes = showingDeletedNotes ? deletedNotes : activeNotes

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    if (!activeNote && activeNotes.length > 0) {
      setActiveNoteId(activeNotes[0].id)
    }
  }, [activeNote, activeNotes])

  useEffect(() => {
    if (!lastDeletedNoteId) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setLastDeletedNoteId(null)
    }, 5000)
    return () => window.clearTimeout(timeoutId)
  }, [lastDeletedNoteId])

  function updateActiveNote(updates) {
    if (!activeNote) {
      return
    }

    setNotes((current) =>
      current.map((note) =>
        note.id === activeNote.id
          ? { ...note, ...updates, updatedAt: Date.now() }
          : note,
      ),
    )
  }

  function handleCreateNote() {
    const note = createNote()
    setNotes((current) => [note, ...current])
    setActiveNoteId(note.id)
    setShowingDeletedNotes(false)
  }

  function handleReorderNotes(fromIndex, toIndex) {
    // `toIndex` is measured before the dragged note is removed. Removing a
    // note before the insertion point shifts that point left by one.
    const insertionIndex =
      fromIndex < toIndex ? toIndex - 1 : toIndex

    if (fromIndex === insertionIndex) {
      return
    }

    setNotes((current) => {
      const active = current.filter((note) => !note.deletedAt)
      const deleted = current.filter((note) => note.deletedAt)
      const next = [...active]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(insertionIndex, 0, moved)
      return [...next, ...deleted]
    })
  }

  function handleDeleteActiveNote() {
    if (!activeNote) {
      return
    }

    const activeIndex = activeNotes.findIndex(
      (note) => note.id === activeNote.id,
    )
    const nextNote =
      activeNotes[activeIndex + 1] ?? activeNotes[activeIndex - 1] ?? null

    setNotes((current) =>
      current.map((note) =>
        note.id === activeNote.id
          ? { ...note, deletedAt: Date.now() }
          : note,
      ),
    )
    setActiveNoteId(nextNote?.id ?? null)
    setLastDeletedNoteId(activeNote.id)
  }

  function handleUndoDelete() {
    if (!lastDeletedNoteId) {
      return
    }

    setNotes((current) =>
      current.map((note) =>
        note.id === lastDeletedNoteId
          ? { ...note, deletedAt: undefined }
          : note,
      ),
    )
    setActiveNoteId(lastDeletedNoteId)
    setLastDeletedNoteId(null)
    setShowingDeletedNotes(false)
  }

  if (!activeNote) {
    return (
      <div className="notes">
        <aside
          className={`month-sidebar${sidebarOpen ? ' month-sidebar-open' : ''}`}
          aria-hidden={!sidebarOpen}
        >
          <NotesSidebar
            notes={sidebarNotes}
            activeNoteId={activeNoteId}
            onSelectNote={setActiveNoteId}
            onCreateNote={handleCreateNote}
            onReorderNotes={handleReorderNotes}
            showingDeletedNotes={showingDeletedNotes}
            onToggleDeletedNotes={() =>
              setShowingDeletedNotes((showing) => !showing)
            }
          />
        </aside>
        <div className="notes-empty">
          <p>아직 노트가 없습니다.</p>
          <button type="button" onClick={handleCreateNote}>
            첫 노트 만들기
          </button>
        </div>
        {lastDeletedNoteId && <DeletedNoteToast onUndo={handleUndoDelete} />}
      </div>
    )
  }

  return (
    <div className="notes">
      <aside
        className={`month-sidebar${sidebarOpen ? ' month-sidebar-open' : ''}`}
        aria-hidden={!sidebarOpen}
      >
        <NotesSidebar
          notes={sidebarNotes}
          activeNoteId={activeNoteId}
          onSelectNote={setActiveNoteId}
          onCreateNote={handleCreateNote}
          onReorderNotes={handleReorderNotes}
          showingDeletedNotes={showingDeletedNotes}
          onToggleDeletedNotes={() =>
            setShowingDeletedNotes((showing) => !showing)
          }
        />
      </aside>

      <div className="notes-main">
        <header className="notes-toolbar">
          <div className="notes-toolbar-start">
            <button
              type="button"
              className={`notes-sidebar-toggle${sidebarOpen ? ' notes-sidebar-toggle-active' : ''}`}
              aria-label={sidebarOpen ? '노트 사이드바 숨기기' : '노트 사이드바 보이기'}
              aria-pressed={sidebarOpen}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <PanelIcon />
            </button>
            <DigitalClock />
          </div>
          <div className="toolbar-actions">
            <MusicMuteButton />
            <AuthButton />
          </div>
        </header>

        <NoteEditor
          key={activeNote.id}
          note={activeNote}
          onTitleChange={(title) => updateActiveNote({ title })}
          onContentChange={(content) => updateActiveNote({ content })}
          onDeleteNote={handleDeleteActiveNote}
          onOpenView={onOpenView}
        />
      </div>
      {lastDeletedNoteId && <DeletedNoteToast onUndo={handleUndoDelete} />}
    </div>
  )
}
