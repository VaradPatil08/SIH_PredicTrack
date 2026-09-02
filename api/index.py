"""Vercel entry point for the PredicTrack FastAPI application.

Vercel discovers this ``app`` object as one Python serverless function.  The
existing backend stays in ``backend/`` so local development commands and the
project structure remain unchanged.
"""

from pathlib import Path
import sys

from fastapi import FastAPI


PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app as backend_app  # noqa: E402


# Keep API endpoints isolated under /api while the Vite single-page app owns
# the remaining routes. The root mount is a compatibility fallback for Vercel
# function invocations that have already stripped the /api file prefix before
# handing the request to the ASGI application.
app = FastAPI(title="PredicTrack Vercel Gateway")
app.mount("/api", backend_app)
app.mount("/", backend_app)
