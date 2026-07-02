import { useState } from 'react'
import { useCalendarTodos } from '../hooks/useCalendarTodos'
import { formatTodoTime } from '../utils/calendarTodos'
import './todoList.css'

export default function TodoList({
  title = 'Tasks',
  placeholder = 'Add a task...',
}) {
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
    <section className="sidebar-todos">
      <h3 className="sidebar-todos-title">{title}</h3>

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
        </ul>
      )}

      <textarea
        className={`sidebar-todos-empty${
          todos.length === 0 ? ' sidebar-todos-empty-solo' : ''
        }`}
        placeholder={placeholder}
        value={todoDraft}
        rows={todos.length > 0 ? 1 : 4}
        aria-label="Add tasks"
        onChange={(event) => setTodoDraft(event.target.value)}
        onKeyDown={handleTodoKeyDown}
        onPaste={handleTodoPaste}
      />
    </section>
  )
}
