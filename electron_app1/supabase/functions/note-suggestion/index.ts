// Supabase Edge Function: note-suggestion
//
// Problem: turn selected note text into one safe action chip without shipping
// a private LLM API key inside the Electron/renderer bundle.
//
// Deploy:
//   supabase functions deploy note-suggestion
// Secrets:
//   supabase secrets set OPENAI_API_KEY=sk-...
//
// Request body:  { "selectedText": "buy speaker" }
// Response body: { "suggestion": { "label": "...", "action": "coupang_search", "query": "speaker" } | null }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const MAX_SELECTION_LENGTH = 200
const ALLOWED_ACTIONS = new Set(['coupang_search'])

const SYSTEM_PROMPT = `You suggest one useful next action for text the user selected in a note.

Always return ONLY a JSON object with this shape:
{"suggestion":{"label":"쿠팡에서 스피커 검색할까요?","action":"coupang_search","query":"스피커"}}

Or when nothing useful applies:
{"suggestion":null}

Rules:
- action must be "coupang_search" when the text is about buying, shopping for, or finding a product.
- query should be a short product search term (no full sentence).
- label should be a short question the user can click, matching the language of the selected text when possible. Prefer Korean labels like "쿠팡에서 {query} 검색할까요?" when the selection is Korean.
- If the text is not shopping-related, return {"suggestion":null}.
- Never invent other action types.
- Keep label under 60 characters.`

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizeSuggestion(payload) {
  if (payload === null) {
    return null
  }
  if (!payload || typeof payload !== 'object') {
    return null
  }

  // Model might return { suggestion: {...} } or the object directly.
  const candidate =
    'suggestion' in payload ? payload.suggestion : payload

  if (candidate === null) {
    return null
  }
  if (!candidate || typeof candidate !== 'object') {
    return null
  }
  if (!ALLOWED_ACTIONS.has(candidate.action)) {
    return null
  }

  const query =
    typeof candidate.query === 'string' ? candidate.query.trim() : ''
  if (!query) {
    return null
  }

  const label =
    typeof candidate.label === 'string' && candidate.label.trim()
      ? candidate.label.trim().slice(0, 80)
      : `쿠팡에서 ${query} 검색할까요?`

  return {
    label,
    action: 'coupang_search',
    query: query.slice(0, 100),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // Require a valid Supabase user session (anon key alone is not enough).
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let body
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const selectedText =
    typeof body?.selectedText === 'string'
      ? body.selectedText.trim().slice(0, MAX_SELECTION_LENGTH)
      : ''

  if (selectedText.length < 2) {
    return jsonResponse({ suggestion: null })
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) {
    return jsonResponse({ error: 'OPENAI_API_KEY is not set' }, 500)
  }

  try {
    const openaiResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: JSON.stringify({ selectedText }),
            },
          ],
        }),
      },
    )

    if (!openaiResponse.ok) {
      const detail = await openaiResponse.text()
      console.error('OpenAI error:', openaiResponse.status, detail)
      return jsonResponse({ error: 'LLM request failed' }, 502)
    }

    const completion = await openaiResponse.json()
    const content = completion?.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') {
      return jsonResponse({ suggestion: null })
    }

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      console.error('Failed to parse LLM JSON:', content)
      return jsonResponse({ suggestion: null })
    }

    return jsonResponse({ suggestion: normalizeSuggestion(parsed) })
  } catch (error) {
    console.error('note-suggestion failed:', error)
    return jsonResponse({ error: 'Internal error' }, 500)
  }
})
