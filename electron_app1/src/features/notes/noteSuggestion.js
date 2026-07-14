import { extractEventTime } from '../../utils/nerClient'

export const MAX_SELECTION_LENGTH = 200
export const MIN_SELECTION_LENGTH = 2

/**
 * Build a Coupang product search URL for a query string.
 */
export function buildCoupangSearchUrl(query) {
  return `https://www.coupang.com/np/search?q=${encodeURIComponent(query)}`
}

/**
 * Cheap gate: should we run the local shopping heuristic?
 * Same idea as looksLikeEventSentence — fail closed so schedule text
 * like "go to gym at 2pm" never gets a Coupang chip by accident.
 */
export function looksLikeShopping(text) {
  const trimmed = text.trim()
  if (trimmed.length < MIN_SELECTION_LENGTH) {
    return false
  }

  if (/\b(?:buy|purchase|order|get|find)\b/i.test(trimmed)) {
    return true
  }

  // Korean shopping intent endings: "스피커 사기", "스피커 구매"
  if (/(?:사기|구매|찾아줘|검색)\s*$/.test(trimmed)) {
    return true
  }

  return false
}

/**
 * Local shopping heuristic (no network / no LLM).
 * Catches phrases like "buy speaker" / "purchase headphones".
 */
export function localSuggest(selectedText) {
  const text = selectedText.trim()
  if (text.length < MIN_SELECTION_LENGTH) {
    return null
  }

  const buyMatch = text.match(
    /(?:buy|purchase|order|get|find)\s+(.+)/i,
  )
  if (buyMatch) {
    const query = buyMatch[1].replace(/[.!?]+$/, '').trim()
    if (!query) {
      return null
    }
    return {
      label: `쿠팡에서 ${query} 검색할까요?`,
      action: 'coupang_search',
      query,
    }
  }

  // Korean shopping intent: "스피커 사기", "스피커 구매"
  const koMatch = text.match(/^(.+?)\s*(?:사기|구매|찾아줘|검색)$/)
  if (koMatch) {
    const query = koMatch[1].trim()
    if (!query) {
      return null
    }
    return {
      label: `쿠팡에서 ${query} 검색할까요?`,
      action: 'coupang_search',
      query,
    }
  }

  return null
}

// --- Schedule (calendar) suggestion helpers -------------------------------

/**
 * Cheap gate that decides whether the selected text is worth sending to the
 * NER model. NER answers "what is the event/time?", this answers "should we
 * even ask?". Fails closed: when unsure, return false and skip the network.
 */
export function looksLikeEventSentence(text) {
  const trimmed = text.trim()
  if (trimmed.length < MIN_SELECTION_LENGTH) {
    return false
  }

  // English clock times: "at 10pm", "2:30", "10 am"
  if (/\b\d{1,2}\s*(?:am|pm)\b/i.test(trimmed)) {
    return true
  }
  if (/\b\d{1,2}:\d{2}\b/.test(trimmed)) {
    return true
  }

  // Korean clock times: "10시", "오후 3시", "오전 9시 30분"
  if (/(?:오전|오후)?\s*\d{1,2}\s*시/.test(trimmed)) {
    return true
  }

  return false
}

/**
 * Convert a time phrase from NER ("10pm", "14:00", "오후 10시 30분") into
 * minutes from midnight. Returns null when the phrase cannot be parsed,
 * so callers can skip creating a broken calendar event.
 */
export function parseTimeToMinutes(timeText) {
  if (typeof timeText !== 'string') {
    return null
  }
  const text = timeText.trim().toLowerCase()
  if (!text) {
    return null
  }

  // Korean first, because "오후 10시" also contains digits the English
  // pattern would match without the 오후 (PM) context.
  const koMatch = text.match(
    /(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/,
  )
  if (koMatch) {
    let hour = Number(koMatch[2])
    const minute = Number(koMatch[3] ?? 0)
    if (hour > 23 || minute > 59) {
      return null
    }
    if (koMatch[1] === '오후' && hour < 12) {
      hour += 12
    }
    if (koMatch[1] === '오전' && hour === 12) {
      hour = 0
    }
    return hour * 60 + minute
  }

  const enMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (enMatch) {
    let hour = Number(enMatch[1])
    const minute = Number(enMatch[2] ?? 0)
    const period = enMatch[3]
    if (hour > 23 || minute > 59) {
      return null
    }
    if (period === 'pm' && hour < 12) {
      hour += 12
    }
    if (period === 'am' && hour === 12) {
      hour = 0
    }
    return hour * 60 + minute
  }

  return null
}

/**
 * Turn the NER response ({ extracted: { event, time } }) into a chip
 * suggestion, or null when either span is missing or the time is unusable.
 */
function normalizeScheduleSuggestion(nerResult) {
  const extracted = nerResult?.extracted
  const title = typeof extracted?.event === 'string' ? extracted.event.trim() : ''
  const timeText = typeof extracted?.time === 'string' ? extracted.time.trim() : ''

  if (!title || !timeText) {
    return null
  }

  // Only suggest when we can actually place the event on the calendar.
  if (parseTimeToMinutes(timeText) === null) {
    return null
  }

  return {
    label: `캘린더에 일정을 추가할까요?`,
    action: 'create_calendar_event',
    title,
    timeText,
  }
}

/**
 * Ask the local NER service (nerClient → Node → FastAPI) for event/time
 * spans. Any failure means "no suggestion" — scheduling is best-effort.
 */
async function fetchScheduleSuggestion(text, { signal } = {}) {
  try {
    const nerResult = await extractEventTime(text, { signal })
    return normalizeScheduleSuggestion(nerResult)
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error
    }
    console.warn('NER schedule suggestion failed:', error)
    return null
  }
}

/**
 * Decide which action chip (if any) fits the selected text.
 * Shopping uses a local regex only; schedule text goes to NER.
 */
export async function fetchNoteSuggestion(selectedText, { signal } = {}) {
  const trimmed = selectedText.trim().slice(0, MAX_SELECTION_LENGTH)
  if (trimmed.length < MIN_SELECTION_LENGTH) {
    return null
  }

  if (looksLikeShopping(trimmed)) {
    const shopping = localSuggest(trimmed)
    if (shopping) {
      return shopping
    }
  }

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  // Gate: don't pay the NER round-trip unless the text mentions a time.
  if (!looksLikeEventSentence(trimmed)) {
    return null
  }

  return fetchScheduleSuggestion(trimmed, { signal })
}
