"""
Model training script — run this ONCE (and re-run whenever the dataset
or features change) to produce the two artifacts the live backend needs:

  ml/model/delay_model.pkl              trained regressor
  ml/model/historical_averages.json     per-station/per-train averages
  ml/model/metrics.json                 real MAE + metadata for the
                                         /model/metrics endpoint

USAGE:
  pip install -r ml/requirements-ml.txt
  python ml/train_model.py path/to/kaggle_delays.csv

EXPECTED INPUT CSV COLUMNS (rename via COLUMN_MAP below to match
whatever your actual Kaggle dataset calls these — they vary a lot
between datasets):
  train_number, station_code, distance_km, total_distance_km,
  scheduled_departure_hour, day_of_week, delay_min

If your dataset doesn't have every column, either derive it before
running this script (e.g. compute day_of_week from a date column) or
extend the loading logic below — don't invent values silently.
"""

import json
import os
import sys

import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib

sys.path.insert(0, os.path.dirname(__file__))
from features import build_features, FEATURE_NAMES  # noqa: E402

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
os.makedirs(MODEL_DIR, exist_ok=True)

# Adjust the right-hand side to your actual CSV's column names.
COLUMN_MAP = {
    "train_number": "train_number",
    "station_code": "station_code",
    "distance_km": "distance_km",
    "total_distance_km": "total_distance_km",
    "scheduled_departure_hour": "scheduled_departure_hour",
    "day_of_week": "day_of_week",
    "delay_min": "delay_min",
}


def compute_historical_averages(df: pd.DataFrame) -> dict:
    """Builds the per-station / per-train average-delay lookup used as a feature."""
    global_avg = df["delay_min"].mean()
    station_avg = df.groupby("station_code")["delay_min"].mean().to_dict()
    train_avg = df.groupby("train_number")["delay_min"].mean().to_dict()
    return {
        "global_avg": round(float(global_avg), 2),
        "station": {k: round(float(v), 2) for k, v in station_avg.items()},
        "train": {k: round(float(v), 2) for k, v in train_avg.items()},
    }


def main(csv_path: str):
    raw = pd.read_csv(csv_path)
    df = raw.rename(columns={v: k for k, v in COLUMN_MAP.items()})

    missing = [c for c in COLUMN_MAP if c not in df.columns]
    if missing:
        print(f"ERROR: missing expected columns after mapping: {missing}")
        print(f"Available columns in your CSV: {list(raw.columns)}")
        print("Fix COLUMN_MAP at the top of this script to match your dataset.")
        sys.exit(1)

    print(f"Loaded {len(df)} rows.")

    # Historical averages must be computed BEFORE the train/test split
    # normally, but to avoid leakage we compute them only from the
    # training split below, then apply to both.
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)

    hist_averages = compute_historical_averages(train_df)

    def row_to_features(row):
        return build_features(
            train_number=str(row["train_number"]),
            station_code=str(row["station_code"]),
            distance_km=float(row["distance_km"]),
            total_distance_km=float(row["total_distance_km"]),
            current_delay_min=float(row.get("current_delay_min", 0)),
            scheduled_departure_hour=int(row["scheduled_departure_hour"]),
            day_of_week=int(row["day_of_week"]),
            hist_averages=hist_averages,
        )

    print("Building feature vectors...")
    X_train = train_df.apply(row_to_features, axis=1).tolist()
    y_train = train_df["delay_min"].tolist()
    X_test = test_df.apply(row_to_features, axis=1).tolist()
    y_test = test_df["delay_min"].tolist()

    print("Training GradientBoostingRegressor...")
    model = GradientBoostingRegressor(
        n_estimators=200, max_depth=3, learning_rate=0.05, random_state=42
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    print(f"Test MAE: {mae:.2f} minutes")

    # Save artifacts
    joblib.dump(model, os.path.join(MODEL_DIR, "delay_model.pkl"))
    with open(os.path.join(MODEL_DIR, "historical_averages.json"), "w") as f:
        json.dump(hist_averages, f, indent=2)

    feature_importance = dict(zip(FEATURE_NAMES, model.feature_importances_.tolist()))
    metrics = {
        "mae_minutes": round(float(mae), 2),
        "trained_on_records": len(train_df),
        "test_records": len(test_df),
        "feature_importance": {k: round(v, 4) for k, v in feature_importance.items()},
        "last_trained": pd.Timestamp.now("UTC").strftime("%Y-%m-%d"),
    }
    with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print("\nSaved to ml/model/:")
    print("  delay_model.pkl")
    print("  historical_averages.json")
    print("  metrics.json")
    print("\nTop features by importance:")
    for name, importance in sorted(feature_importance.items(), key=lambda x: -x[1]):
        print(f"  {name}: {importance:.3f}")
    print("\nRestart the FastAPI server to pick up the new model.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python ml/train_model.py path/to/kaggle_delays.csv")
        sys.exit(1)
    main(sys.argv[1])
