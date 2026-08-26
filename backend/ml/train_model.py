"""
Model training script — trains a LightGBM regressor against real railway data
(data/processed/ml_training_data.csv) and persists the artifacts for backend/app/services/eta.py:

  backend/ml/model/delay_model.pkl          trained LightGBM regressor
  backend/ml/model/historical_averages.json per-station/per-train averages + static lookup
  backend/ml/model/metrics.json             test MAE + training metadata for /model/metrics

USAGE:
  python backend/ml/train_model.py [optional_path_to_ml_training_data.csv]
"""

import json
import math
import os
import sys

import joblib
import lightgbm as lgb
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import GroupShuffleSplit

sys.path.insert(0, os.path.dirname(__file__))
from features import build_features, FEATURE_NAMES  # noqa: E402

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
DEFAULT_DATA_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed", "ml_training_data.csv")
)


def compute_historical_averages_and_lookup(train_df: pd.DataFrame) -> dict:
    """
    Builds the per-station/per-train average delay lookup and static feature lookup
    strictly from the training split to avoid lookahead data leakage.
    """
    global_avg = float(train_df["average_delay_minutes"].mean())
    station_avg = {
        str(k): round(float(v), 2)
        for k, v in train_df.groupby("station_code")["average_delay_minutes"].mean().to_dict().items()
    }
    train_avg = {
        str(k).zfill(5): round(float(v), 2)
        for k, v in train_df.groupby("train_id")["average_delay_minutes"].mean().to_dict().items()
    }

    global_congestion = float(train_df["station_congestion_index"].mean()) if "station_congestion_index" in train_df.columns else global_avg
    station_congestion = {
        str(k): round(float(v), 2)
        for k, v in train_df.groupby("station_code")["station_congestion_index"].mean().to_dict().items()
    } if "station_congestion_index" in train_df.columns else {}

    station_halt = {
        str(k): round(float(v), 2)
        for k, v in train_df.groupby("station_code")["scheduled_halt_duration_min"].mean().to_dict().items()
    } if "scheduled_halt_duration_min" in train_df.columns else {}

    # Build trimmed fast-lookup table for static and route-based historical features
    lookup = {}
    for _, row in train_df.iterrows():
        tid = str(row["train_id"]).zfill(5)
        stn = str(row["station_code"]).upper()
        key = f"{tid}_{stn}"
        lookup[key] = {
            "train_priority": int(row.get("train_priority", 1)),
            "scheduled_halt_duration_min": round(float(row.get("scheduled_halt_duration_min", 2.0)), 2),
            "hist_delay_lag1": round(float(row.get("hist_delay_lag1", 0.0)), 2),
            "hist_delay_lag2": round(float(row.get("hist_delay_lag2", 0.0)), 2),
            "section_delay_gradient": round(float(row.get("section_delay_gradient", 0.0)), 2),
            "station_congestion_index": round(float(row.get("station_congestion_index", global_congestion)), 2),
        }

    return {
        "global_avg": round(global_avg, 2),
        "global_congestion": round(global_congestion, 2),
        "station": station_avg,
        "train": train_avg,
        "station_congestion": station_congestion,
        "station_halt": station_halt,
        "lookup": lookup,
    }


def main(csv_path: str = None):
    if not csv_path:
        csv_path = DEFAULT_DATA_PATH

    if not os.path.exists(csv_path):
        print(f"ERROR: Training data CSV not found at: {csv_path}")
        print("Please ensure scripts/04_feature_engineering.py has been run to produce data/processed/ml_training_data.csv.")
        sys.exit(1)

    os.makedirs(MODEL_DIR, exist_ok=True)

    print(f"Loading dataset from: {csv_path}")
    raw_df = pd.read_csv(csv_path, low_memory=False)
    raw_df["train_id"] = raw_df["train_id"].astype(str).str.zfill(5)
    raw_df["station_code"] = raw_df["station_code"].astype(str).str.upper()

    print(f"Loaded {len(raw_df)} records across {raw_df['train_id'].nunique()} unique train journeys.")

    # Group-aware train/test split: all stations/segments of the same journey stay together
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(splitter.split(raw_df, groups=raw_df["train_id"]))
    train_df = raw_df.iloc[train_idx].copy().reset_index(drop=True)
    test_df = raw_df.iloc[test_idx].copy().reset_index(drop=True)

    print(f"Train set: {len(train_df)} rows ({train_df['train_id'].nunique()} trains)")
    print(f"Test set : {len(test_df)} rows ({test_df['train_id'].nunique()} trains)")

    # Historical averages and lookup table computed strictly on train partition
    hist_averages = compute_historical_averages_and_lookup(train_df)

    def row_to_feature_vector(row):
        dep_hour = int(row["dep_min"] // 60) if "dep_min" in row and pd.notna(row["dep_min"]) else 12
        tot_dist = float(row["distance_km"]) + float(row.get("remaining_distance_km", 0.0))
        # Prior arrival delay from preceding section is used as incoming live delay
        incoming_delay = float(row.get("hist_delay_lag1", 0.0))
        return build_features(
            train_number=str(row["train_id"]),
            station_code=str(row["station_code"]),
            distance_km=float(row["distance_km"]),
            total_distance_km=tot_dist,
            current_delay_min=incoming_delay,
            scheduled_departure_hour=dep_hour,
            day_of_week=2,  # Default mid-week profile
            hist_averages=hist_averages,
        )

    print("Building feature vectors for training and evaluation...")
    X_train = [row_to_feature_vector(row) for _, row in train_df.iterrows()]
    y_train = [float(row["average_delay_minutes"]) for _, row in train_df.iterrows()]

    X_test = [row_to_feature_vector(row) for _, row in test_df.iterrows()]
    y_test = [float(row["average_delay_minutes"]) for _, row in test_df.iterrows()]

    print("Training LightGBM Regressor...")
    model = lgb.LGBMRegressor(
        n_estimators=300,
        learning_rate=0.05,
        num_leaves=31,
        min_child_samples=10,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbose=-1,
    )
    model.fit(X_train, y_train)

    test_preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, test_preds)
    rmse = math.sqrt(mean_squared_error(y_test, test_preds))

    print(f"\nModel Performance on Unseen Journeys:")
    print(f"  Test MAE : {mae:.2f} minutes")
    print(f"  Test RMSE: {rmse:.2f} minutes")

    # Persist model artifacts
    model_path = os.path.join(MODEL_DIR, "delay_model.pkl")
    joblib.dump(model, model_path)

    hist_path = os.path.join(MODEL_DIR, "historical_averages.json")
    with open(hist_path, "w", encoding="utf-8") as f:
        json.dump(hist_averages, f, indent=2)

    importances = model.feature_importances_
    feature_importance_map = {
        name: round(float(imp), 4) for name, imp in zip(FEATURE_NAMES, importances)
    }

    metrics_path = os.path.join(MODEL_DIR, "metrics.json")
    metrics = {
        "mae_minutes": round(float(mae), 2),
        "test_rmse_minutes": round(float(rmse), 2),
        "trained_on_records": len(train_df),
        "test_records": len(test_df),
        "feature_importance": feature_importance_map,
        "last_trained": pd.Timestamp.now("UTC").strftime("%Y-%m-%d"),
    }
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nSuccessfully generated and saved artifacts to backend/ml/model/:")
    print(f"  - delay_model.pkl ({os.path.getsize(model_path):,} bytes)")
    print(f"  - historical_averages.json ({os.path.getsize(hist_path):,} bytes)")
    print(f"  - metrics.json ({os.path.getsize(metrics_path):,} bytes)")

    print("\nFeature Importances:")
    for name, imp in sorted(feature_importance_map.items(), key=lambda x: -x[1]):
        print(f"  {name:28s}: {imp}")


if __name__ == "__main__":
    csv_file = sys.argv[1] if len(sys.argv) > 1 else None
    main(csv_file)

