import { supabase } from '../../lib/supabase'

export const MAX_SELECTION_LENGTH = 200
export const MIN_SELECTION_LENGTH = 2

/**
 * Build a Coupang product search URL for a query string.
 */
export function buildCoupangSearchUrl(query) {
  return `https://www.coupang.com/np/search?q=${encodeURIComponent(query)}`
}

/**
 * Cheap local fallback when the Edge Function is unavailable.
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
      label: `Search ${query} in Coupang?`,
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

function normalizeSuggestion(payload) {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  if (payload.action !== 'coupang_search') {
    return null
  }

  const query = typeof payload.query === 'string' ? payload.query.trim() : ''
  if (!query) {
    return null
  }

  const label =
    typeof payload.label === 'string' && payload.label.trim()
      ? payload.label.trim()
      : `Search ${query} in Coupang?`

  return { label, action: 'coupang_search', query }
}

/**
 * Ask the note-suggestion Edge Function for an action chip.
 * Falls back to a local heuristic if the user is signed out, the function
 * is missing, or the request errors.
 */
export async function fetchNoteSuggestion(selectedText, { signal } = {}) {
  const trimmed = selectedText.trim().slice(0, MAX_SELECTION_LENGTH)
  if (trimmed.length < MIN_SELECTION_LENGTH) {
    return null
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Edge Function requires a logged-in user. Without a session, skip the
  // network call and use the local "buy X" heuristic so the chip still works.
  if (!session) {
    return localSuggest(trimmed)
  }

  try {
    const invokePromise = supabase.functions.invoke('note-suggestion', {
      body: { selectedText: trimmed },
    })

    // supabase-js does not accept AbortSignal on invoke yet, so we race.
    const result = signal
      ? await Promise.race([
          invokePromise,
          new Promise((_, reject) => {
            if (signal.aborted) {
              reject(new DOMException('Aborted', 'AbortError'))
              return
            }
            signal.addEventListener(
              'abort',
              () => reject(new DOMException('Aborted', 'AbortError')),
              { once: true },
            )
          }),
        ])
      : await invokePromise

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    const { data, error } = result
    if (error) {
      console.warn(
        'note-suggestion function error, using local fallback:',
        error.message,
      )
      return localSuggest(trimmed)
    }

    // Edge Function may return { suggestion: null } when nothing useful.
    if (data && 'suggestion' in data) {
      return normalizeSuggestion(data.suggestion)
    }

    return normalizeSuggestion(data)
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error
    }
    console.warn('note-suggestion request failed, using local fallback:', error)
    return localSuggest(trimmed)
  }
}
