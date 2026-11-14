import json
import sys
from contextlib import redirect_stdout
from io import StringIO
import numpy as np
import pandas as pd

from pathlib import Path
from xgboost import XGBRegressor

from prepare_data import prepare_data
from train_model import FEATURE_COLUMNS


MODEL_DIR = Path(__file__).resolve().parent / "model"

ELECTRICITY_RATE = 0.158
FORECAST_MONTHS = 12


def load_models():
    first_floor_model = XGBRegressor()
    second_floor_model = XGBRegressor()

    first_floor_model.load_model(
        str(MODEL_DIR / "first_floor_model.json")
    )

    second_floor_model.load_model(
        str(MODEL_DIR / "second_floor_model.json")
    )

    return first_floor_model, second_floor_model



def create_features(history, target_date):
    month = target_date.month
    year = target_date.year

    return pd.DataFrame([{
        "Year": year,
        "Month_Sin": np.sin(2 * np.pi * month / 12),
        "Month_Cos": np.cos(2 * np.pi * month / 12),
        "Lag_1": history["Usage"].iloc[-1],
        "Lag_2": history["Usage"].iloc[-2],
        "Lag_3": history["Usage"].iloc[-3],
        "Lag_12": history["Usage"].iloc[-12],
        "Rolling_Mean_3": history["Usage"].tail(3).mean(),
    }], columns=FEATURE_COLUMNS)



def forecast_floor(model, df, target, months):
    history = pd.DataFrame({
        "Period_Start": df["Period_Start"],
        "Usage": df[target]
    }).copy()

    predictions = []

    for _ in range(months):
        # Generate the next month
        next_date = (
            history["Period_Start"].iloc[-1]
            + pd.DateOffset(months=1)
        )

        features = create_features(history, next_date)

        predicted_usage = float(model.predict(features)[0])

        # Electricity usage cannot be negative
        predicted_usage = max(0, predicted_usage)

        predictions.append({
            "Period_Start": next_date,
            "Predicted_Usage": predicted_usage
        })

        # Add prediction to history for the next forecast
        history.loc[len(history)] = [
            next_date,
            predicted_usage
        ]

    return pd.DataFrame(predictions)


def generate_forecast(df=None):
    if df is None:
        df = prepare_data()

    first_model, second_model = load_models()

    first_forecast = forecast_floor(
        first_model,
        df,
        "First_Floor",
        FORECAST_MONTHS
    )

    second_forecast = forecast_floor(
        second_model,
        df,
        "Second_Floor",
        FORECAST_MONTHS
    )

    forecast = pd.DataFrame({
        "Period_Start": first_forecast["Period_Start"],
        "First_Floor_Predicted": first_forecast["Predicted_Usage"],
        "Second_Floor_Predicted": second_forecast["Predicted_Usage"]
    })

    forecast["Total_Predicted"] = (
        forecast["First_Floor_Predicted"]
        + forecast["Second_Floor_Predicted"]
    )

    forecast["Predicted_Cost"] = (
        forecast["Total_Predicted"] * ELECTRICITY_RATE
    )

    # Compare each forecast month with the previous month's usage
    previous_total = float(df["Total_kWh"].iloc[-1])

    changes = []

    for _, row in forecast.iterrows():
        change = (
            (row["Total_Predicted"] - previous_total)
            / previous_total
        ) * 100

        changes.append(change)

        previous_total = row["Total_Predicted"]

    forecast["Usage_Change_Percent"] = changes

    forecast["Month"] = (
        forecast["Period_Start"].dt.strftime("%b-%y")
    )

    return forecast

def generate_chart_data():

    # Load actual monthly data
    actual_df = prepare_data()

    # Get actual data from January to November 2026
    actual_2026 = actual_df[
        (actual_df["Period_Start"].dt.year == 2026) &
        (actual_df["Period_Start"].dt.month <= 11)
    ].copy()

    # Generate future predictions using the already loaded dataset
    forecast = generate_forecast(actual_df)

    # Get December 2026 prediction
    december = forecast[
        forecast["Period_Start"] == pd.Timestamp("2026-12-01")
    ].iloc[0]

    # Prepare actual chart data
    chart_data = actual_2026[
        ["Period_Start", "Month", "Total_kWh"]
    ].copy()

    chart_data = chart_data.rename(
    columns={"Total_kWh": "Actual_Usage"}
    )

    chart_data["Predicted_Usage"] = np.nan

    # Use November actual as the prediction line's starting point
    chart_data.loc[
        chart_data.index[-1], "Predicted_Usage"
    ] = chart_data.iloc[-1]["Actual_Usage"]

    # Add December prediction
    december_row = pd.DataFrame([{
        "Period_Start": december["Period_Start"],
        "Month": december["Month"],
        "Actual_Usage": np.nan,
        "Predicted_Usage": december["Total_Predicted"]
    }])

    chart_data = pd.concat(
        [chart_data, december_row],
        ignore_index=True
    )

    return chart_data


if __name__ == "__main__":

    if "--json" in sys.argv:

        # Suppress diagnostic messages from the forecasting functions
        with redirect_stdout(StringIO()):

            chart_data = generate_chart_data()
            forecast_data = generate_forecast()

        # Convert both DataFrames into JSON-compatible records
        result = {
            "chart": json.loads(
                chart_data.to_json(
                    orient="records",
                    date_format="iso"
                )
            ),
            "forecast": json.loads(
                forecast_data.to_json(
                    orient="records",
                    date_format="iso"
                )
            )
        }

        print(json.dumps(result))

    else:

        chart_data = generate_chart_data()

        print("\nAI Forecasting Chart Data")

        print(
            chart_data[
                [
                    "Month",
                    "Actual_Usage",
                    "Predicted_Usage"
                ]
            ].round(2).to_string(index=False)
        )
