import { supabase } from '../../lib/supabase'

export const CALENDAR_EVENTS_STORAGE_KEY = 'calendar-events'
export const CALENDAR_EVENTS_CHANGED_EVENT = 'calendar-events-changed'

function nowIso() {
  return new Date().toISOString()
}

const EVENT_COLOR_KEYS = new Set(['orange', 'purple', 'blue'])

function normalizeEvent(event) {
  const createdAt = event.createdAt ?? nowIso()
  const color = EVENT_COLOR_KEYS.has(event.color) ? event.color : null

  return {
    id: event.id,
    dateKey: event.dateKey,
    title: event.title ?? '새 일정',
    details: event.details ?? '',
    dayIndex: Number(event.dayIndex ?? 0),
    startMinute: Number(event.startMinute ?? 0),
    endMinute: Number(event.endMinute ?? 30),
    color,
    createdAt,
    updatedAt: event.updatedAt ?? createdAt,
  }
}

function isValidEvent(event) {
  return (
    event &&
    typeof event.id === 'string' &&
    typeof event.dateKey === 'string' &&
    Number.isFinite(event.dayIndex) &&
    Number.isFinite(event.startMinute) &&
    Number.isFinite(event.endMinute)
  )
}

function eventToRow(userId, event) {
  const normalized = normalizeEvent(event)
  return {
    id: normalized.id,
    user_id: userId,
    date_key: normalized.dateKey,
    title: normalized.title,
    details: normalized.details,
    day_index: normalized.dayIndex,
    start_minute: normalized.startMinute,
    end_minute: normalized.endMinute,
    created_at: normalized.createdAt,
    updated_at: normalized.updatedAt,
  }
}

function rowToEvent(row) {
  return normalizeEvent({
    id: row.id,
    dateKey: row.date_key,
    title: row.title,
    details: row.details,
    dayIndex: row.day_index,
    startMinute: row.start_minute,
    endMinute: row.end_minute,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

export function loadLocalCalendarEvents() {
  try {
    const stored = localStorage.getItem(CALENDAR_EVENTS_STORAGE_KEY)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map(normalizeEvent).filter(isValidEvent)
  } catch {
    return []
  }
}

export function saveLocalCalendarEvents(events) {
  const normalizedEvents = events.map(normalizeEvent).filter(isValidEvent)
  localStorage.setItem(
    CALENDAR_EVENTS_STORAGE_KEY,
    JSON.stringify(normalizedEvents),
  )
  window.dispatchEvent(new CustomEvent(CALENDAR_EVENTS_CHANGED_EVENT))
  return normalizedEvents
}

export async function fetchRemoteCalendarEvents(userId) {
  const { data, error } = await supabase
    .from('calendar_events')
    .select(
      'id, date_key, title, details, day_index, start_minute, end_minute, created_at, updated_at',
    )
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  return (data ?? []).map(rowToEvent)
}

export async function upsertRemoteCalendarEvent(userId, event) {
  const { error } = await supabase
    .from('calendar_events')
    .upsert(eventToRow(userId, event), { onConflict: 'id' })

  if (error) {
    throw error
  }
}

export async function deleteRemoteCalendarEvent(userId, eventId) {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('user_id', userId)
    .eq('id', eventId)

  if (error) {
    throw error
  }
}

export function mergeCalendarEvents(localEvents, remoteEvents) {
  const byId = new Map()

  for (const event of [...localEvents, ...remoteEvents]) {
    const normalized = normalizeEvent(event)
    if (!isValidEvent(normalized)) {
      continue
    }

    const current = byId.get(normalized.id)
    if (
      !current ||
      new Date(normalized.updatedAt).getTime() >
        new Date(current.updatedAt).getTime()
    ) {
      byId.set(normalized.id, normalized)
    }
  }

  return [...byId.values()]
}

export async function syncCalendarEventsOnLogin(userId) {
  const localEvents = loadLocalCalendarEvents()
  const remoteEvents = await fetchRemoteCalendarEvents(userId)
  const mergedEvents = saveLocalCalendarEvents(
    mergeCalendarEvents(localEvents, remoteEvents),
  )

  await Promise.all(
    mergedEvents.map((event) => upsertRemoteCalendarEvent(userId, event)),
  )

  return mergedEvents
}

export async function getSignedInUserId() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}
