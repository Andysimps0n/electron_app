import { useRef } from 'react'
import { useCalendarTodos } from '../hooks/useCalendarTodos'
import { formatTodoTime } from '../utils/calendarTodos'
import './todoList.css'

// After we add a Hangul task and clear the field, the IME may still insert
// the last confirmed syllable (e.g. "기"). Swallow that echo briefly.
const IME_ECHO_GUARD_MS = 300

export default function TodoList({
  title = '할 일',
  placeholder = '할 일 추가...',
}) {
  const { todos, addTodo, toggleTodo, deleteTodo } = useCalendarTodos()
  const inputRef = useRef(null)
  const isComposingRef = useRef(false)
  const echoGuardUntilRef = useRef(0)
  const lastCommittedTextRef = useRef('')

  function armEchoGuard() {
    echoGuardUntilRef.current = Date.now() + IME_ECHO_GUARD_MS
  }

  function isEchoGuardActive() {
    return Date.now() < echoGuardUntilRef.current
  }

  // Exact bug shape: we just added "요리하기", then the IME leaves only "기".
  function isImeLeftoverSyllable(text) {
    const previous = lastCommittedTextRef.current
    if (!previous || !text) {
      return false
    }

    return previous.endsWith(text) && text.length <= 2
  }

  function commitTodoDraft(text) {
    const trimmed = text.trim()
    if (!trimmed) {
      return false
    }

    if (isEchoGuardActive() && isImeLeftoverSyllable(trimmed)) {
      return false
    }

    addTodo(trimmed)
    lastCommittedTextRef.current = trimmed
    armEchoGuard()
    return true
  }

  function clearInput(textarea) {
    if (textarea) {
      textarea.value = ''
    }
  }

  function handleCompositionStart() {
    isComposingRef.current = true
  }

  function handleCompositionEnd() {
    // Keep the flag true until after this event turn. Some Chromium + Hangul
    // paths fire Enter in the same press with isComposing already false.
    window.setTimeout(() => {
      isComposingRef.current = false
    }, 0)
  }

  function handleTodoKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }

    event.preventDefault()

    if (
      isComposingRef.current ||
      event.isComposing ||
      event.nativeEvent.isComposing ||
      event.keyCode === 229
    ) {
      return
    }

    const textarea = event.currentTarget
    const text = textarea.value

    // Second Enter in the same IME press: field already holds only the echo.
    if (isEchoGuardActive() && isImeLeftoverSyllable(text.trim())) {
      clearInput(textarea)
      return
    }

    commitTodoDraft(text)
    clearInput(textarea)
  }

  function handleTodoInput(event) {
    if (!isEchoGuardActive()) {
      return
    }

    const value = event.currentTarget.value.trim()
    if (isImeLeftoverSyllable(value)) {
      clearInput(event.currentTarget)
    }
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
    clearInput(event.currentTarget)
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
                  aria-label={`"${todo.text}"을(를) ${
                    todo.done ? '미완료' : '완료'
                  }(으)로 표시`}
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
                aria-label={`"${todo.text}" 삭제`}
                onClick={() => deleteTodo(todo.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <textarea
        ref={inputRef}
        className={`sidebar-todos-input${
          todos.length === 0 ? ' sidebar-todos-input-solo' : ''
        }`}
        placeholder={placeholder}
        defaultValue=""
        rows={todos.length > 0 ? 1 : 4}
        aria-label="할 일 추가"
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleTodoKeyDown}
        onInput={handleTodoInput}
        onPaste={handleTodoPaste}
      />
    </section>
  )
}
