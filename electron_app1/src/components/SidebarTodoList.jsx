import { useState } from 'react'
import { formatTodoTime } from '../utils/calendarTodos'

export default function SidebarTodoList({
  todos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  title = 'Upcoming Tasks',
}) {
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
      <h3 className="sidebar-todos__title">{title}</h3>

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
                    {formatTodoTime(todo.timeMinute)}
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
        </ul>
      )}

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
    </section>
  )
}
