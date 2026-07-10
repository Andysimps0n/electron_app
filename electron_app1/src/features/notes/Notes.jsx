import { useEffect, useRef, useState } from 'react'
import DigitalClock from '../../shared/DigitalClock'
import AuthButton from '../../shared/AuthButton'
import MusicMuteButton from '../../shared/MusicMuteButton'
import {
  BulletListIcon,
  ChecklistIcon,
  HighlightIcon,
  PanelIcon,
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

    return parsed
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

function sortNotesByRecent(notes) {
  return [...notes].sort((a, b) => b.createdAt - a.createdAt)
}

function NotesSidebar({ notes, activeNoteId, onSelectNote, onCreateNote }) {
  const recentNotes = sortNotesByRecent(notes)

  return (
    <aside className="sidebar notes-sidebar">
      <div className="notes-sidebar-header">
        <h2 className="sidebar-title">최근 노트</h2>
        <button
          type="button"
          className="notes-sidebar-new-btn"
          onClick={onCreateNote}
        >
          + 새 노트
        </button>
      </div>

      <ul className="notes-sidebar-list">
        {recentNotes.map((note) => (
          <li key={note.id}>
            <button
              type="button"
              className={`notes-sidebar-item${
                note.id === activeNoteId ? ' notes-sidebar-item-active' : ''
              }`}
              onClick={() => onSelectNote(note.id)}
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
        ))}
      </ul>
    </aside>
  )
}

const HIGHLIGHT_COLOR = 'rgba(112, 243, 80, 0.35)'

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

function NoteFormatToolbar({ editorRef, onContentChange }) {
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
    </div>
  )
}

function NoteEditor({ note, onTitleChange, onContentChange }) {
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

      <NoteSelectionSuggestion editorRef={editorRef} noteId={note.id} />
    </div>
  )
}

export default function Notes({ defaultSidebarOpen = true }) {
  const [notes, setNotes] = useState(loadNotes)
  const [activeNoteId, setActiveNoteId] = useState(() => notes[0]?.id ?? null)
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen)

  const activeNote = notes.find((note) => note.id === activeNoteId) ?? notes[0]

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    if (!activeNote && notes.length > 0) {
      setActiveNoteId(notes[0].id)
    }
  }, [activeNote, notes])

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
  }

  if (!activeNote) {
    return (
      <div className="notes">
        <aside
          className={`month-sidebar${sidebarOpen ? ' month-sidebar-open' : ''}`}
          aria-hidden={!sidebarOpen}
        >
          <NotesSidebar
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={setActiveNoteId}
            onCreateNote={handleCreateNote}
          />
        </aside>
        <div className="notes-empty">
          <p>아직 노트가 없습니다.</p>
          <button type="button" onClick={handleCreateNote}>
            첫 노트 만들기
          </button>
        </div>
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
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={setActiveNoteId}
          onCreateNote={handleCreateNote}
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
        />
      </div>
    </div>
  )
}
