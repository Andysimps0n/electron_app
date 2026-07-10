import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  CALENDAR_EVENTS_CHANGED_EVENT,
  deleteRemoteCalendarEvent,
  loadLocalCalendarEvents,
  saveLocalCalendarEvents,
  upsertRemoteCalendarEvent,
} from '../features/sync/calendarEventSync'

function getTimestamp() {
  return new Date().toISOString()
}

function applyUpdates(event, updates) {
  const nextUpdates =
    typeof updates === 'function' ? updates(event) : updates
  return {
    ...event,
    ...nextUpdates,
    updatedAt: getTimestamp(),
  }
}

export function useCalendarEvents() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const userIdRef = useRef(userId)
  const [events, setEvents] = useState(loadLocalCalendarEvents)
  const eventsRef = useRef(events)

  userIdRef.current = userId
  eventsRef.current = events

  useEffect(() => {
    function handleCalendarEventsChanged() {
      setEvents(loadLocalCalendarEvents())
    }

    window.addEventListener(
      CALENDAR_EVENTS_CHANGED_EVENT,
      handleCalendarEventsChanged,
    )
    return () => {
      window.removeEventListener(
        CALENDAR_EVENTS_CHANGED_EVENT,
        handleCalendarEventsChanged,
      )
    }
  }, [])

  function syncEvent(event) {
    const currentUserId = userIdRef.current
    if (!currentUserId) {
      return
    }

    upsertRemoteCalendarEvent(currentUserId, event).catch((error) => {
      console.error('Failed to sync calendar event:', error)
    })
  }

  function syncDelete(eventId) {
    const currentUserId = userIdRef.current
    if (!currentUserId) {
      return
    }

    deleteRemoteCalendarEvent(currentUserId, eventId).catch((error) => {
      console.error('Failed to delete remote calendar event:', error)
    })
  }

  function commitEvents(nextEvents) {
    const savedEvents = saveLocalCalendarEvents(nextEvents)
    eventsRef.current = savedEvents
    setEvents(savedEvents)
    return savedEvents
  }

  function createEvent(event) {
    const timestamp = getTimestamp()
    const nextEvent = {
      ...event,
      createdAt: event.createdAt ?? timestamp,
      updatedAt: timestamp,
    }

    commitEvents([...eventsRef.current, nextEvent])
    syncEvent(nextEvent)
    return nextEvent
  }

  function createEvents(eventsToCreate) {
    if (!eventsToCreate.length) {
      return []
    }

    const timestamp = getTimestamp()
    const nextEvents = eventsToCreate.map((event) => ({
      ...event,
      createdAt: event.createdAt ?? timestamp,
      updatedAt: timestamp,
    }))

    commitEvents([...eventsRef.current, ...nextEvents])
    nextEvents.forEach(syncEvent)
    return nextEvents
  }

  function updateEvent(eventId, updates) {
    let updatedEvent = null
    const nextEvents = eventsRef.current.map((event) => {
      if (event.id !== eventId) {
        return event
      }

      updatedEvent = applyUpdates(event, updates)
      return updatedEvent
    })

    commitEvents(nextEvents)

    if (updatedEvent) {
      syncEvent(updatedEvent)
    }

    return updatedEvent
  }

  function deleteEvent(eventId) {
    commitEvents(eventsRef.current.filter((event) => event.id !== eventId))
    syncDelete(eventId)
  }

  return {
    events,
    createEvent,
    createEvents,
    updateEvent,
    deleteEvent,
  }
}
