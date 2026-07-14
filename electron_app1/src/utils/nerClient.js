// Client for the NER pipeline: this app → Node proxy → FastAPI model.
//
// Vite bakes VITE_* env vars into the bundle at build time. In production
// (Vercel) VITE_NER_URL points at the deployed Node proxy on Render; when
// it's not set we fall back to the local dev server.
const NER_BASE_URL = import.meta.env.VITE_NER_URL || "http://localhost:3000";

/**
 * Ask the NER service for event/time spans in a sentence.
 * Request:  { text: "go to gym at 10pm" }
 * Response: { extracted: { event: "gym", time: "10pm" } }
 *
 * Accepts an AbortSignal so callers can cancel an in-flight request when
 * the user changes their selection.
 */
export async function extractEventTime(text, { signal } = {}) {
  const res = await fetch(`${NER_BASE_URL}/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok) throw new Error("NER service failed");
  return res.json();
}
