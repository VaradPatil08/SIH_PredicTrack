# PredicTrack — ML Model Artifacts

This folder holds trained model artifacts (not checked into version control).
Run `python backend/ml/train_model.py` to populate it — see `train_model.py`'s
docstring for the expected CSV format. Until `delay_model.pkl` exists here,
the backend automatically falls back to placeholder delay predictions
(see `app/services/eta.py`).

## What the Model Does

**PredicTrack** uses a LightGBM gradient-boosted tree to predict the delay (in minutes)
a train will accumulate by the time it reaches the **next station** along its route,
given everything known about its current state — cumulative distance travelled,
historical congestion at this station, the delay it carried in from the previous stop,
and the trend (accelerating or recovering) over the last few stations.

## The Physics-Informed Kinematics Angle (v4 Feature Set)

The v4 feature set introduces a **trapezoidal velocity profile** model — the same
physics used in robot and AGV (automated guided vehicle) trajectory planning — to
quantify how much physical headroom each schedule segment actually gives a train.
For each inter-station segment we compute the *minimum feasible travel time* under
realistic acceleration and top-speed limits (160 km/h / 2400 km/h² for Vande Bharat
and Rajdhani, down to 75 km/h / 750 km/h² for Passenger services): if the train were
to run flat-out the entire segment without any unplanned stops, how fast could it
physically complete it?
Dividing this kinematic minimum by the scheduled segment time gives the
**schedule slack ratio** — a value near or above 1.0 means the schedule is already
tight enough that no amount of driver effort can recover an existing delay on that
segment, while a ratio of 0.5 means the train has a 2× speed margin and delay
recovery is theoretically easy.
On top of this, the feature set includes a **kinematic delay extrapolation** —
a Newtonian ½at² forward-projection of the current delay using its measured
velocity (rate of change over the last station) and acceleration (second
finite difference over three stations) — giving the model a physics-grounded
prior to correct against, rather than predicting raw delay from scratch.

## Files

| File | Description |
|---|---|
| `delay_model.pkl` | Trained LightGBM regressor (21 features, v4) |
| `historical_averages.json` | Per-station/per-train delay averages + kinematic segment lookup |
| `metrics.json` | Test MAE, RMSE, feature importances, training metadata |
