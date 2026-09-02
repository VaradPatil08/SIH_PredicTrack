from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routers import trains, auth, preferences, reports, pnr, admin
from app.db import init_db
from app.services.auth_service import DEV_MODE
import app.models_db  # noqa: F401

# Create database tables and apply migrations
init_db()

app = FastAPI(
    title="PredicTrack API",
    description="Dynamic ETA prediction for Indian coaching trains — SIH project",
    version="0.1.0",
)

frontend_origin = os.getenv("FRONTEND_ORIGIN")
if frontend_origin:
    allowed_origins = [origin.strip().rstrip("/") for origin in frontend_origin.split(",") if origin.strip()]
elif DEV_MODE:
    allowed_origins = ["*"]
else:
    raise RuntimeError("FRONTEND_ORIGIN is required when RAILPULSE_DEV_MODE is false")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trains.router)
app.include_router(auth.router)
app.include_router(preferences.router)
app.include_router(reports.router)
app.include_router(pnr.router)
app.include_router(admin.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "PredicTrack API"}

