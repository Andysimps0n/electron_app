import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Need { text : "weqweqweq" }
app.post("/extract", async (req, res) => {
  console.log(req.body);
  try {
    const schedule = await extract(req.body.text);
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "NER service failed" });
  }
});

app.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});

async function extract(text) {
  const response = await fetch("http://127.0.0.1:8000/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text,
    }),
  });

  // If Python is down or returns 4xx/5xx, stop here so the frontend
  // gets a real failure instead of a weird/empty JSON body.
  if (!response.ok) {
    throw new Error(`Python NER failed with status ${response.status}`);
  }

  const data = await response.json();
  console.log(data);
  return data;
}
