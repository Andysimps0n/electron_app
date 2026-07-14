


// Need { text : "weqweqweq" }
export async function extractEventTime(text) {
  const res = await fetch("http://localhost:3000/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("NER service failed");
  return res.json();
}