# Deploy this Edge Function after setting secrets:
#
#   cd electron_app1
#   supabase login
#   supabase link --project-ref <your-project-ref>
#   supabase secrets set OPENAI_API_KEY=sk-...
#   supabase functions deploy note-suggestion
#
# The renderer calls it via supabase.functions.invoke('note-suggestion').
# Users must be signed in (Authorization header from the Supabase session).
# If the function is unavailable, the app falls back to a local heuristic
# for phrases like "buy speaker".
