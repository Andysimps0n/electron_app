import express from "express";

const app = express();

// --- Deployment configuration (environment variables) ---
// Render injects PORT; locally we keep the familiar 3000.
const PORT = process.env.PORT || 3000;

// Where the Python FastAPI model lives. On Render this is the FastAPI
// service's public URL; locally it's the uvicorn dev server.
const NER_SERVICE_URL = process.env.NER_SERVICE_URL || "http://127.0.0.1:8000";

// Which browser origins may call this proxy. In production, set
// CLIENT_ORIGIN to the deployed frontend URL (e.g. https://myapp.vercel.app).
// The localhost entries keep local development working.
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
if (process.env.CLIENT_ORIGIN) {
  ALLOWED_ORIGINS.push(process.env.CLIENT_ORIGIN);
}

// The notes UI runs on a different origin (Vite :5173 / Vercel) than this
// proxy. Browsers block cross-origin fetch unless we send CORS headers.
// We echo the request's Origin back only if it's on our allow list, instead
// of "*", so random websites can't call our API from their pages.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Expects { text: "go to gym at 10pm" }
app.post("/extract", async (req, res) => {
  const text = req.body?.text;

  // Reject bad input here so we never forward garbage to the model service.
  if (typeof text !== "string" || text.trim() === "") {
    return res.status(400).json({ error: "Request body must include a non-empty 'text' string" });
  }

  try {
    const schedule = await extract(text);
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "NER service failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

async function extract(text) {
  const response = await fetch(`${NER_SERVICE_URL}/extract`, {
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
  return data;
}
