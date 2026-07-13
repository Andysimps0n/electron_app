export async function extractEventTime(text) {
  const res = await fetch(process.env.NER_URL + "/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("NER service failed");
  return res.json();
}