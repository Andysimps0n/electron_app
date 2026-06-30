export const TODOS_STORAGE_KEY = 'calendar-todos'
export const TODOS_CHANGED_EVENT = 'calendar-todos-changed'

export function createTodo(text, timeMinute = null) {
  return {
    id: crypto.randomUUID(),
    text,
    done: false,
    timeMinute,
    createdAt: Date.now(),
  }
}

export function getDefaultTodos() {
  return [
    createTodo('Review quarterly report', 9 * 60),
    createTodo('Sync with design team', 11 * 60 + 30),
    createTodo('Prepare sprint presentation', 14 * 60),
  ]
}

export function loadTodos() {
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

export function saveTodos(todos) {
  localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos))
  window.dispatchEvent(new CustomEvent(TODOS_CHANGED_EVENT))
}

export function formatTodoTime(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`
}
