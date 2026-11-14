from sklearn.model_selection import TimeSeriesSplit
import numpy as np
import pandas as pd

from pathlib import Path
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

from prepare_data import prepare_data


MODEL_DIR = Path(__file__).resolve().parent / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

TARGETS = {
    "First_Floor": "first_floor_model.json",
    "Second_Floor": "second_floor_model.json",
}

FEATURE_COLUMNS = [
    "Year",
    "Month_Sin",
    "Month_Cos",
    "Lag_1",
    "Lag_2",
    "Lag_3",
    "Lag_12",
    "Rolling_Mean_3",
]


def create_features(df, target):
    data = df[["Period_Start", target]].copy()

    data["Year"] = data["Period_Start"].dt.year

    month = data["Period_Start"].dt.month

    data["Month_Sin"] = np.sin(2 * np.pi * month / 12)
    data["Month_Cos"] = np.cos(2 * np.pi * month / 12)

    data["Lag_1"] = data[target].shift(1)
    data["Lag_2"] = data[target].shift(2)
    data["Lag_3"] = data[target].shift(3)
    data["Lag_12"] = data[target].shift(12)

    data["Rolling_Mean_3"] = (
        data[target].shift(1).rolling(window=3).mean()
    )

    data = data.dropna().reset_index(drop=True)

    return data


def create_model():
    return XGBRegressor(
        objective="reg:squarederror",
        n_estimators=100,
        max_depth=2,
        learning_rate=0.03,
        subsample=0.9,
        colsample_bytree=0.9,
        min_child_weight=3,
        reg_lambda=5,
        random_state=42,
        n_jobs=2,
    )


def train_models():
    df = prepare_data()

    for target, filename in TARGETS.items():

        print(f"\nTraining model: {target}")

        data = create_features(df, target)

        X = data[FEATURE_COLUMNS]
        y = data[target]

        # Walk-forward time series validation
        time_series_split = TimeSeriesSplit(n_splits=5)

        mae_scores = []
        rmse_scores = []

        for fold, (train_index, test_index) in enumerate(
            time_series_split.split(X), start=1
        ):
            X_train = X.iloc[train_index]
            X_test = X.iloc[test_index]

            y_train = y.iloc[train_index]
            y_test = y.iloc[test_index]

            evaluation_model = create_model()
            evaluation_model.fit(X_train, y_train)

            predictions = evaluation_model.predict(X_test)

            mae = mean_absolute_error(y_test, predictions)
            rmse = np.sqrt(mean_squared_error(y_test, predictions))

            mae_scores.append(mae)
            rmse_scores.append(rmse)

            print(f"\nFold {fold}")
            print(f"Training records: {len(X_train)}")
            print(f"Testing records: {len(X_test)}")
            print(f"MAE: {mae:.4f} kWh")
            print(f"RMSE: {rmse:.4f} kWh")

        print("\nOverall Validation Results")
        print(f"Average MAE: {np.mean(mae_scores):.4f} kWh")
        print(f"Average RMSE: {np.mean(rmse_scores):.4f} kWh")

        # Train final model using all available actual records
        final_model = create_model()
        final_model.fit(X, y)

        model_path = MODEL_DIR / filename
        final_model.save_model(str(model_path))

        print(f"Model saved: {model_path}")


if __name__ == "__main__":
    train_models()
