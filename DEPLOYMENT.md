# PredicTrack deployment on Vercel

PredicTrack deploys as **one Vercel project**:

- The React/Vite application is served at `/`.
- The FastAPI application runs as a Vercel Python Function under `/api`.
- The frontend calls `/api` on the same domain, so no Render URL or browser CORS setup is required.

## 1. Prepare the database

Vercel Functions have an ephemeral filesystem, so SQLite is only appropriate for local development. Create a managed PostgreSQL database (for example, through a Vercel Marketplace integration) and keep its connection string.

## 2. Create one Vercel project

1. Push this repository to GitHub and import it into Vercel.
2. Set the project's **Root Directory** to the repository root — do not select `frontend` or `backend`.
3. Leave the framework preset as **Other**. The committed `vercel.json` builds the Vite frontend and deploys `api/index.py` as the FastAPI function.
4. Deploy.

The root `vercel.json` installs the frontend dependencies, writes the static site to `frontend/dist`, reserves `/api/*` for FastAPI, and sends all other routes to the Vite SPA entry point. It also excludes training scripts, tests, and raw data from the Python function bundle.

## 3. Configure Vercel environment variables

Add these variables in **Project Settings → Environment Variables** for Production, Preview, and Development as appropriate:

| Variable | Required | Value |
|---|---:|---|
| `RAILPULSE_DEV_MODE` | Yes | `false` for production |
| `RAILPULSE_JWT_SECRET` | Yes | A long, random secret |
| `DATABASE_URL` | Yes | Managed PostgreSQL connection string |
| `RAILRADAR_API_KEY` | Optional | RailRadar credential for live telemetry |
| `RAILRADAR_BASE_URL` | Optional | `https://api.railradar.in` |
| `RAILRADAR_MONTHLY_LIMIT` | Optional | For example, `1000` |
| `RAILRADAR_SAFETY_MARGIN` | Optional | For example, `50` |
| `RAILRADAR_CACHE_TTL_SECONDS` | Optional | For example, `300` |

Do **not** set `VITE_API_BASE_URL` for this deployment. The production bundle defaults to the same-origin `/api` path. Set it only if intentionally pointing the frontend at a different API host.

`FRONTEND_ORIGIN` is optional on Vercel: the backend derives the deployment origin from Vercel's `VERCEL_URL` variable. It can still be set when a known, fixed custom origin needs to make cross-origin API requests.

After saving variables, redeploy so they are available to the function.

## 4. Verify

- Visit `https://YOUR-PROJECT.vercel.app/`.
- Visit `https://YOUR-PROJECT.vercel.app/api/` and confirm the JSON health response is returned.
- Confirm a train search, tracking view, passenger login, and Station Admin login all call `/api/...` in the browser network panel.
- Refresh a client-side route such as `/train/12951` or `/admin` and confirm it returns the SPA rather than a 404.
- Submit a crowd report, then reload to confirm data persists in PostgreSQL.

## Local development

Run the backend and frontend separately while developing locally:

```bash
# Terminal 1
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2
cd frontend
npm install
npm run dev
```

`frontend/.env.example` uses `http://localhost:8000`, so local frontend calls continue to reach the local FastAPI server. For a production-like local run, install the Vercel CLI and use `vercel dev` from the repository root.

## Operational notes

- The deployed Python function is serverless. In-memory values and local files are not durable across invocations; PostgreSQL is required for users, favourites, OTP records, and crowd reports.
- The ML model and processed reference data are bundled with the function. Do not add large raw datasets to the runtime bundle.
- The OTP sender is currently a demo stub. Integrate a real SMS/phone provider before using production authentication with real users.
