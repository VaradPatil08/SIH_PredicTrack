# PredicTrack // Dynamic ML Train ETA Prediction

PredicTrack is an industrial control-room telemetry interface and dynamic machine learning ETA prediction engine for Indian Railways coaching services (Smart India Hackathon 2026).

---

## Features

- **LightGBM delay prediction** — 21-feature model trained on real + synthetically augmented Indian Railways schedule data. Test MAE: 14.38 min, RMSE: 27.96 min.
- **Physics-informed kinematics** — S-curve Hermite trajectory smoothing, kinematic speed-ceiling features (`kinematic_extrapolated_delay`, `schedule_slack_ratio`), and discrete-step delay propagation.
- **Dynamic root-cause attribution** — per-station delay reasons are ML-state-derived (not hardcoded), deterministically summing to the predicted delay.
- **What-If scenario simulator** — Station Admin-exclusive panel to inject fog, freight precedence, TSR speed cautions, and platform holds; impacts propagate through the model in real time.
- **Bilingual UI** — Full English / Hindi (हिन्दी) interface via `frontend/src/locales/translations.js`.
- **Light & Dark theme** — Persistent per-user theme preference stored in `localStorage`.
- **Offline resilience** — If the backend is unreachable, `frontend/src/services/api.js` transparently falls back to a deterministic synthetic simulation with identical data shapes.

---

## Project Structure

```text
SIH_PredicTrack/
├── backend/                              # FastAPI REST API Service
│   ├── app/
│   │   ├── models/
│   │   │   └── schemas.py                # Pydantic request/response schemas (API contract)
│   │   ├── routers/
│   │   │   ├── trains.py                 # /trains, /route, /eta, /reasons, /live/sync, /model/metrics
│   │   │   ├── auth.py                   # /auth/otp/request, /otp/verify, /admin/login
│   │   │   ├── preferences.py            # /users/me and /users/me/preferences (CRUD)
│   │   │   ├── reports.py                # /trains/{n}/reports (crowdsourced disruption reports)
│   │   │   ├── pnr.py                    # /pnr/lookup (stub — always returns found=false)
│   │   │   └── admin.py                  # /admin/stations, /admin/station/{code}/arrivals
│   │   ├── services/
│   │   │   ├── eta.py                    # ML inference, delay prediction, root-cause attribution
│   │   │   ├── live_feed.py              # S-curve kinematic trajectory simulation
│   │   │   ├── live_sync.py              # RailRadar live data sync (requires API key)
│   │   │   ├── auth_service.py           # JWT auth, OTP handling, bcrypt password hashing
│   │   │   ├── railradar_client.py       # External RailRadar API client
│   │   │   ├── railradar_interpolation.py # GPS interpolation from external telemetry
│   │   │   └── quota_guard.py            # API rate-limit guard for external calls
│   │   ├── db.py                         # SQLAlchemy SQLite setup & session management
│   │   ├── models_db.py                  # ORM models: User, OTPCode, Report, TrainLiveCache
│   │   └── main.py                       # FastAPI app entrypoint with CORS, router mounts
│   ├── ml/
│   │   ├── features.py                   # SINGLE SOURCE OF TRUTH for the 21-feature vector
│   │   ├── train_model.py                # LightGBM training pipeline with data augmentation
│   │   └── model/                        # Serialized artifacts (delay_model.pkl, metrics.json)
│   ├── scripts/
│   │   └── seed_station_admins.py        # Provisions demo station_admin accounts
│   ├── data/
│   │   └── processed/                    # Training CSVs and schedule data
│   └── requirements.txt                  # Python backend dependencies
├── frontend/                             # React + Vite + Tailwind CSS UI
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx           # Train search + home
│   │   │   ├── TrackingPage.jsx          # Live multi-train tracking (map + timeline)
│   │   │   ├── AdminPage.jsx             # Station Admin arrivals board
│   │   │   └── AboutPage.jsx             # Project info
│   │   ├── components/
│   │   │   ├── TrainMap.jsx              # Leaflet map with animated train markers
│   │   │   ├── StationTimeline.jsx       # Per-station ETA + delay attribution cards
│   │   │   ├── DelaySparkline.jsx        # Delay-progression graph (focused train)
│   │   │   ├── WhatIfSimulator.jsx       # Station Admin-only disruption scenario sandbox
│   │   │   ├── Navbar.jsx                # Top navigation with role-aware admin link
│   │   │   ├── Footer.jsx
│   │   │   ├── ReportModal.jsx           # Crowdsourced disruption report submission
│   │   │   ├── AdminLoginModal.jsx       # Station Admin login modal
│   │   │   ├── AuthModal.jsx             # Passenger OTP login modal
│   │   │   ├── RequireStationAdmin.jsx   # Route guard for /admin
│   │   │   ├── SettingsModal.jsx         # Theme + language preferences
│   │   │   ├── AnimatedNumber.jsx        # Smooth counter animation utility
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── SkeletonLoader.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx           # Auth state, token, favorites, admin login flow
│   │   │   └── SettingsContext.jsx       # Theme (light/dark) and language (en/hi) state
│   │   ├── services/
│   │   │   └── api.js                    # API client with automatic offline fallback
│   │   ├── locales/
│   │   │   ├── translations.js           # English + Hindi UI string translations
│   │   │   ├── delayReasons.js           # Delay category labels (EN + HI)
│   │   │   └── trainNames.js             # Station/train name lookup and transliteration
│   │   └── utils/
│   │       ├── time.js                   # Duration formatting helpers
│   │       └── trainColors.js            # Per-train colour palette
│   ├── DESIGN.md                         # Design system specification (Sora + IBM Plex Sans)
│   └── package.json
├── scripts/
│   └── build_train_directory.py          # Utility to rebuild mock_trains.json from public data
└── README.md
```

---

## Quickstart & Local Development

### 1. Backend Service (FastAPI)

Prerequisites: Python 3.10+

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# (Optional) Seed demo station admin accounts
python scripts/seed_station_admins.py

# Start the FastAPI server with live reload
uvicorn app.main:app --reload --port 8000
```

Available at:
- **API Base**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 2. ML Model Training (optional — pre-trained model included)

```bash
cd backend/ml

# Install ML-specific dependencies (lightgbm, pandas, numpy, scikit-learn)
pip install -r requirements-ml.txt

# Retrain from data/processed/ml_training_data.csv
python train_model.py
```

Outputs: `backend/ml/model/delay_model.pkl` and `backend/ml/model/metrics.json`.

### 3. Frontend Application (React + Vite)

Prerequisites: Node.js 18+

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Available at http://localhost:5173.

> [!NOTE]
> `frontend/.env.example` defaults `VITE_API_BASE_URL` to `http://localhost:8000`. Copy `.env.example` to `.env` to override.

---

## API Contract

All endpoints are mounted on the FastAPI app at `http://localhost:8000`. The full schema is in `backend/app/models/schemas.py`, consumed by `frontend/src/services/api.js`.

### Trains

| Endpoint | Method | Description |
|---|---|---|
| `/trains` | GET | List all demo coaching trains with metadata |
| `/trains/search?q={query}` | GET | Search trains by number, name, origin, or destination |
| `/trains/{train_number}/route` | GET | Static station list with GIS lat/lng coordinates |
| `/trains/{train_number}/eta` | GET | Live kinematic position, velocity, and per-station delay ETAs |
| `/trains/{train_number}/eta/{station_code}/reasons` | GET | Dynamic root-cause delay attribution for a specific station |
| `/trains/{train_number}/live/sync` | POST | Trigger a RailRadar live telemetry sync (requires `RAILRADAR_API_KEY` env var) |
| `/model/metrics` | GET | ML model performance metrics (MAE, RMSE, feature count, last trained) |

### Auth

| Endpoint | Method | Description |
|---|---|---|
| `/auth/otp/request` | POST | Request a one-time password for passenger login |
| `/auth/otp/verify` | POST | Verify OTP and receive a JWT token |
| `/auth/admin/login` | POST | Station Admin login with username/password |

### User Preferences

| Endpoint | Method | Description |
|---|---|---|
| `/users/me` | GET | Get current authenticated user's profile |
| `/users/me/preferences` | GET | Get saved favourite train numbers |
| `/users/me/preferences` | POST | Add a train to favourites |
| `/users/me/preferences/{train_number}` | DELETE | Remove a train from favourites |

### Disruption Reports

| Endpoint | Method | Description |
|---|---|---|
| `/trains/{train_number}/reports` | POST | Submit a crowdsourced disruption report |
| `/trains/{train_number}/reports` | GET | List all reports for a train |
| `/trains/{train_number}/reports/summary` | GET | Aggregated disruption summary |

### PNR

| Endpoint | Method | Description |
|---|---|---|
| `/pnr/lookup` | POST | **Stub** — not yet integrated with IRCTC; always returns `found: false` |

### Admin *(Station Admin role required)*

| Endpoint | Method | Description |
|---|---|---|
| `/admin/stations` | GET | List all stations with arrival counts (for the station picker) |
| `/admin/station/{code}/arrivals` | GET | Live arrivals board for a station with predicted delays |

---

## Bilingual UI & Theming

- **Languages**: English and हिन्दी (Hindi) are fully supported. All UI strings live in `frontend/src/locales/translations.js`. Language preference is persisted per user.
- **Theme**: Light and Dark mode are supported throughout. Preference is persisted in `localStorage` and toggled via the settings panel in the Navbar.

---

## ML Model Details

| Metric | Value |
|---|---|
| Algorithm | LightGBM gradient-boosted regressor |
| Target label | `target_next_station_delay` (minutes of delay at next station) |
| Features | 21 (kinematic + schedule + historical + temporal) |
| Test MAE | 14.38 min |
| Test RMSE | 27.96 min |
| Training records | 12,650 (1,150 real + 11,500 synthetic, lognormal delay augmentation) |
| Feature set version | v4 |

The feature vector is defined exclusively in `backend/ml/features.py` (`build_features()`). Both `train_model.py` and `app/services/eta.py` import it directly — training and inference are guaranteed to stay in sync.

---

## Offline Resilience

`frontend/src/services/api.js` includes automatic client-side synthetic fallback. If the backend is unreachable during a demo, the frontend generates structurally identical responses with smooth kinematic simulation drift — no crashes, no error screens.

