import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend/ directory or root directory if present
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)
else:
    load_dotenv()

RAILRADAR_API_KEY = os.getenv("RAILRADAR_API_KEY", "").strip()
RAILRADAR_BASE_URL = os.getenv("RAILRADAR_BASE_URL", "https://api.railradar.in").rstrip("/")
RAILRADAR_MONTHLY_LIMIT = int(os.getenv("RAILRADAR_MONTHLY_LIMIT", "1000"))
RAILRADAR_SAFETY_MARGIN = int(os.getenv("RAILRADAR_SAFETY_MARGIN", "50"))
# Shared telemetry cache TTL in seconds.
# With the frontend 60s polling cadence, 300s (5 min) ensures RailRadar is queried
# at most once every 5 minutes per train while client polls every 60s without consuming extra quota.
RAILRADAR_CACHE_TTL_SECONDS = int(os.getenv("RAILRADAR_CACHE_TTL_SECONDS", "300"))

