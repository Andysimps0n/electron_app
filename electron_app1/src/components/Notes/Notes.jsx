import { useEffect, useRef, useState } from 'react'

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

  return 'Untitled'
}

function sortNotesByRecent(notes) {
  return [...notes].sort((a, b) => b.createdAt - a.createdAt)
}

function NotesSidebar({ notes, activeNoteId, onSelectNote, onCreateNote }) {
  const recentNotes = sortNotesByRecent(notes)

  return (
    <aside className="sidebar notes-sidebar">
      <div className="notes-sidebar__header">
        <h2 className="sidebar__title">Recent Notes</h2>
        <button
          type="button"
          className="notes-sidebar__new-btn"
          onClick={onCreateNote}
        >
          + New
        </button>
      </div>

      <ul className="notes-sidebar__list">
        {recentNotes.map((note) => (
          <li key={note.id}>
            <button
              type="button"
              className={`notes-sidebar__item${
                note.id === activeNoteId ? ' notes-sidebar__item--active' : ''
              }`}
              onClick={() => onSelectNote(note.id)}
            >
              <span className="notes-sidebar__item-title">
                {getNoteDisplayTitle(note)}
              </span>
              <span className="notes-sidebar__item-date">
                {new Date(note.createdAt).toLocaleDateString(undefined, {
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

function NoteEditor({ note, onTitleChange, onContentChange }) {
  const editorRef = useRef(null)

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

    function handleKeyDown(event) {
      if (!event.altKey) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === 'b') {
        event.preventDefault()
        document.execCommand('bold')
        return
      }

      if (key === 't') {
        event.preventDefault()
        document.execCommand('formatBlock', false, 'h2')
      }
    }

    editor.addEventListener('keydown', handleKeyDown)
    return () => editor.removeEventListener('keydown', handleKeyDown)
  }, [note.id])

  function handleInput() {
    onContentChange(editorRef.current?.innerHTML ?? '')
  }

  return (
    <div className="note-editor">
      <input
        type="text"
        className="note-editor__title"
        placeholder="Note title"
        value={note.title}
        onChange={(event) => onTitleChange(event.target.value)}
      />

      <div
        ref={editorRef}
        className="note-editor__body"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Note content"
        data-placeholder="Start writing… (⌥B bold, ⌥T title)"
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  )
}

export default function Notes() {
  const [notes, setNotes] = useState(loadNotes)
  const [activeNoteId, setActiveNoteId] = useState(() => notes[0]?.id ?? null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
          className={`month-sidebar${sidebarOpen ? ' month-sidebar--open' : ''}`}
          aria-hidden={!sidebarOpen}
        >
          <NotesSidebar
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={setActiveNoteId}
            onCreateNote={handleCreateNote}
          />
        </aside>
        <div className="notes__empty">
          <p>No notes yet.</p>
          <button type="button" onClick={handleCreateNote}>
            Create your first note
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="notes">
      <aside
        className={`month-sidebar${sidebarOpen ? ' month-sidebar--open' : ''}`}
        aria-hidden={!sidebarOpen}
      >
        <NotesSidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={setActiveNoteId}
          onCreateNote={handleCreateNote}
        />
      </aside>

      <div className="notes__main">
        <header className="notes__toolbar">
          <button
            type="button"
            className={`notes__sidebar-toggle${sidebarOpen ? ' notes__sidebar-toggle--active' : ''}`}
            aria-label={sidebarOpen ? 'Hide notes sidebar' : 'Show notes sidebar'}
            aria-pressed={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
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
          </button>
          <span className="notes__shortcuts-hint">⌥B bold · ⌥T title</span>
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
