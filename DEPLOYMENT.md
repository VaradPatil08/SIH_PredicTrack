# RailPulse / PredicTrack Deployment

This repo deploys the **FastAPI backend to Render** and the **React/Vite frontend to Vercel**.
Production uses PostgreSQL; local development continues to use SQLite when `DATABASE_URL` is not set.

## 1. Push the repository to GitHub

From the repository root:

```bash
git status
git add .
git commit -m "Prepare RailPulse for production deployment"
git push origin main
```

If the repository uses a different default branch, push that branch instead.

## 2. Deploy the backend to Render

### Option A — Blueprint

The repository contains `render.yaml`. In Render, choose **New → Blueprint** and select the GitHub repository.
Render will create the Python web service and PostgreSQL database described there.

### Option B — Render Dashboard

Create a **Web Service** from the GitHub repository with:

- Runtime: **Python**
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Python: **3.11** (or a supported newer Python version)

Attach/create a Render PostgreSQL database and set its connection string as `DATABASE_URL`.

### Backend environment variables

Set these in Render:

| Variable | Value |
|---|---|
| `RAILPULSE_DEV_MODE` | `false` |
| `RAILPULSE_JWT_SECRET` | Long random secret; never commit it |
| `DATABASE_URL` | Render PostgreSQL connection string |
| `FRONTEND_ORIGIN` | Your Vercel frontend URL, e.g. `https://railpulse.vercel.app` |
| `RAILRADAR_API_KEY` | Your RailRadar API key |
| `RAILRADAR_BASE_URL` | `https://api.railradar.in` |
| `RAILRADAR_MONTHLY_LIMIT` | Your chosen quota limit, e.g. `1000` |
| `RAILRADAR_SAFETY_MARGIN` | Your safety margin, e.g. `50` |
| `RAILRADAR_CACHE_TTL_SECONDS` | Cache TTL, e.g. `300` |

`RAILPULSE_JWT_SECRET`, `RAILRADAR_API_KEY`, `DATABASE_URL`, and the final `FRONTEND_ORIGIN` must be configured in the Render dashboard. Do not commit production secrets.

When `RAILPULSE_DEV_MODE=false`, the backend refuses to start without `RAILPULSE_JWT_SECRET` and `FRONTEND_ORIGIN`.

## 3. Deploy the frontend to Vercel

Create a **Vercel Project** from the same GitHub repository.

Use:

- Framework Preset: **Vite**
- Root Directory: `frontend`
- Install Command: `npm install` (Vercel can use its default)
- Build Command: `npm run build`
- Output Directory: `dist`

Set this Vercel environment variable:

```text
VITE_API_BASE_URL=https://YOUR-RAILPULSE-BACKEND.onrender.com
```

The repository includes `frontend/vercel.json`, which rewrites SPA routes to `index.html`. This allows direct refreshes of routes such as `/train/12951` and `/admin` without a Vercel 404.

## 4. Connect the two production URLs

After both services have deployed:

1. Copy the live **Vercel URL**.
2. In Render, set `FRONTEND_ORIGIN` to that exact URL (without a trailing slash).
3. Copy the live **Render backend URL**.
4. In Vercel, set `VITE_API_BASE_URL` to that exact Render URL.
5. Redeploy the Render backend.
6. Redeploy the Vercel frontend.

If multiple frontend origins are required, `FRONTEND_ORIGIN` accepts a comma-separated list.

## 5. Production smoke test

- Open the Vercel URL in a **fresh/incognito window**.
- Confirm the landing page is shown with no logged-in user, no admin state, and no saved favorites.
- Open `/admin` directly in the same fresh/incognito window and confirm the Station Admin login is required.
- Sign up/login as a passenger.
- Reload the page while the JWT is still valid; confirm the passenger remains logged in.
- Close/reopen the browser profile and confirm the valid session persists.
- Let/use an expired or invalid token; confirm it is cleared and the UI returns to logged-out state.
- Log in as a Station Admin and confirm `/admin` works.
- Confirm a passenger cannot access Station Admin routes.
- Confirm the arrivals board can load from the Render API.
- Submit a crowd report and confirm it appears in the report list/reason aggregation.
- Confirm a passenger can delete only their own report and a Station Admin can delete any report.
- Switch English/Hindi and verify visible navigation, errors, report text, and delay reasons update without requiring a new fetch.
- Refresh `/train/12951` and `/admin/<station>` directly to verify Vercel SPA routing.

## Local development

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Without `DATABASE_URL`, the backend uses the local `./railpulse.db` SQLite database.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

For local development, `frontend/.env.example` uses:

```text
VITE_API_BASE_URL=http://localhost:8000
```

## Notes and limitations

- Production PostgreSQL is required because Render's ephemeral filesystem is not suitable for persistent SQLite application data.
- Real SMS delivery is still a separate production integration: the current OTP sender is intentionally a development stub. Set `RAILPULSE_DEV_MODE=false` for deployment and integrate a real SMS/phone-auth provider before relying on OTP authentication in production.
- RailRadar credentials and quota values are deployment-specific and must be supplied manually.
- The repository cannot create/configure your GitHub, Render, PostgreSQL, or Vercel accounts from source code alone.


## Firebase Phone OTP

Passenger login uses Firebase Authentication's Phone provider in the browser. Firebase sends the SMS and verifies the code; the frontend then sends the Firebase ID token to FastAPI, which verifies that token with the Firebase Admin SDK and maps the verified phone number to the existing `User` table.

### Firebase Console setup

1. Create a Firebase project at the Firebase Console.
2. Open **Authentication → Sign-in method** and enable **Phone**.
3. Under **Authentication → Settings → Authorized domains**, add your Vercel domain and `localhost` for local development.
4. Register a **Web app** in Firebase and copy its web configuration into Vercel environment variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. For a zero-cost SIH demo, add a **test phone number** under Firebase Authentication's Phone provider settings. Firebase lets you define a fixed test code for that number, so no SMS is sent.
6. For real phone numbers, Firebase Phone Auth SMS is a paid service and requires the appropriate billing plan; do not describe real SMS delivery as free.

### Firebase Admin setup on Render

In Firebase Console, open **Project settings → Service accounts**, generate a new private key, and keep the downloaded JSON private. Put the complete JSON contents into a Render secret named `FIREBASE_SERVICE_ACCOUNT_JSON`.

Also set:
- `FIREBASE_ENABLED=true`
- `RAILPULSE_DEV_MODE=false`

Never put the Firebase service-account JSON/private key in Vercel or the Git repository.

### Authentication flow

`Browser → Firebase Phone Auth + reCAPTCHA → SMS/test OTP → Firebase ID token → FastAPI /auth/firebase/verify → Firebase Admin verify_id_token() → local User → PredicTrack JWT`
