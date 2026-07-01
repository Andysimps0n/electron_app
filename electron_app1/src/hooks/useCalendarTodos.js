import { useEffect, useRef, useState } from 'react'
import {
  createTodo,
  loadTodos,
  saveTodos,
  TODOS_CHANGED_EVENT,
} from '../utils/calendarTodos'

export function useCalendarTodos() {
  const [todos, setTodos] = useState(loadTodos)
  const todosRef = useRef(todos)

  todosRef.current = todos

  useEffect(() => {
    function handleTodosChanged() {
      setTodos(loadTodos())
    }

    window.addEventListener(TODOS_CHANGED_EVENT, handleTodosChanged)
    return () => {
      window.removeEventListener(TODOS_CHANGED_EVENT, handleTodosChanged)
    }
  }, [])

  function updateTodos(updater) {
    const next =
      typeof updater === 'function' ? updater(todosRef.current) : updater

    saveTodos(next)
    setTodos(next)
  }

  function addTodo(text) {
    const currentTime = new Date()
    const timeMinute = currentTime.getHours() * 60 + currentTime.getMinutes()
    updateTodos((current) => [createTodo(text, timeMinute), ...current])
  }

  function toggleTodo(id) {
    updateTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo,
      ),
    )
  }

  function deleteTodo(id) {
    updateTodos((current) => current.filter((todo) => todo.id !== id))
  }

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
  }
}
