// Client for the local NER pipeline: this app → Node proxy → FastAPI model.
// The base URL can be overridden with VITE_NER_URL (e.g. a LAN IP) and
// defaults to the local Node server.

/**
 * Ask the NER service for event/time spans in a sentence.
 * Request:  { text: "go to gym at 10pm" }
 * Response: { extracted: { event: "gym", time: "10pm" } }
 *
 * Accepts an AbortSignal so callers can cancel an in-flight request when
 * the user changes their selection.
 */
export async function extractEventTime(text, { signal } = {}) {
  const res = await fetch(`http://localhost:3000/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok) throw new Error("NER service failed");
  return res.json();
}
