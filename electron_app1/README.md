# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Deployment (Vercel + Render)

The app is three deployable pieces. Deploy them in this order, because each
one needs the URL of the one below it:

```
Browser → Vercel (React static site) → Render (Node proxy) → Render (FastAPI model)
```

### 1. FastAPI model service (Render)

Create a Render **Web Service** from this repo with:

- Root directory: `electron_app1/fastAPI`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

The `my_tinybert/` model folder is committed to the repo, so it deploys with
the code. When it's live, copy the service URL (e.g.
`https://my-ner.onrender.com`).

Note: the free tier has 512 MB RAM which may be too small for
PyTorch + Transformers; if the service is killed during startup, upgrade the
instance size.

### 2. Node proxy (Render)

Create a second Render **Web Service** with:

- Root directory: `electron_app1`
- Build command: `npm ci`
- Start command: `node server/index.js`

Environment variables:

| Name              | Value                                          |
| ----------------- | ---------------------------------------------- |
| `NER_SERVICE_URL` | The FastAPI service URL from step 1            |
| `CLIENT_ORIGIN`   | Your Vercel site URL (e.g. `https://myapp.vercel.app`) |

(Render sets `PORT` automatically; the server reads it.)

### 3. Frontend (Vercel)

In the Vercel project settings:

- Root directory: `electron_app1`
- Build command: `npm run build`
- Output directory: `dist`

Environment variable:

| Name           | Value                              |
| -------------- | ---------------------------------- |
| `VITE_NER_URL` | The Node proxy URL from step 2     |

Vite bakes `VITE_*` variables into the JavaScript bundle **at build time**,
so this value is public (fine — it's just a URL) and you must **redeploy**
after changing it.

### Local development

No environment variables are needed locally; everything falls back to
localhost defaults:

```bash
# Terminal 1 — Python model
cd fastAPI && uvicorn main:app --port 8000

# Terminal 2 — Node proxy
node server/index.js

# Terminal 3 — frontend
npm run dev
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
