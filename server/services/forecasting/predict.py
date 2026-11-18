
import json
import sys
from contextlib import redirect_stdout
from io import StringIO
from datetime import datetime
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd

from pathlib import Path
from xgboost import XGBRegressor

from .prepare_data import prepare_data
from .train_model import FEATURE_COLUMNS


MODEL_DIR = Path(__file__).resolve().parent / "model"

ELECTRICITY_RATE = 0.158
FORECAST_MONTHS = 1
TIMEZONE = "Asia/Phnom_Penh"


def get_target_month():
    # Get the current month in Cambodia
    now = datetime.now(ZoneInfo(TIMEZONE))

    # Always target the first day of the current month
    return pd.Timestamp(
        year=now.year,
        month=now.month,
        day=1
    )


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


def forecast_floor(model, df, target, target_date):
    history = pd.DataFrame({
        "Period_Start": df["Period_Start"],
        "Usage": df[target]
    }).copy()

    predictions = []

    # Predict each missing month until we reach the target month.
    # Intermediate predictions are used as history only.
    while history["Period_Start"].iloc[-1] < target_date:

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

        # Add the prediction to history for the following month
        history.loc[len(history)] = [
            next_date,
            predicted_usage
        ]

    # Return only the requested target month's prediction
    if not predictions:
        raise ValueError(
            "The target month must be after the latest historical month."
        )

    return pd.DataFrame([predictions[-1]])


def generate_forecast(df=None):
    if df is None:
        df = prepare_data()

    target_date = get_target_month()

    first_model, second_model = load_models()

    first_forecast = forecast_floor(
        first_model,
        df,
        "First_Floor",
        target_date
    )

    second_forecast = forecast_floor(
        second_model,
        df,
        "Second_Floor",
        target_date
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

    # Compare the forecast with the latest actual historical usage
    previous_total = float(df["Total_kWh"].iloc[-1])

    changes = []

    for _, row in forecast.iterrows():
        if previous_total > 0:
            change = (
                (row["Total_Predicted"] - previous_total)
                / previous_total
            ) * 100
        else:
            change = 0

        changes.append(change)

    forecast["Usage_Change_Percent"] = changes

    forecast["Month"] = (
        forecast["Period_Start"].dt.strftime("%b-%y")
    )

    return forecast


def generate_chart_data():

    # Load actual monthly data
    actual_df = prepare_data()

    # Get actual data for the current year
    current_year = get_target_month().year

    actual_year = actual_df[
        actual_df["Period_Start"].dt.year == current_year
    ].copy()

    # Generate the current month's forecast
    forecast = generate_forecast(actual_df)

    target_month = forecast.iloc[0]

    # Prepare actual chart data
    chart_data = actual_year[
        ["Period_Start", "Month", "Total_kWh"]
    ].copy()

    chart_data = chart_data.rename(
        columns={"Total_kWh": "Actual_Usage"}
    )

    chart_data["Predicted_Usage"] = np.nan

    # Use the last actual month as the prediction line's starting point
    chart_data.loc[
        chart_data.index[-1], "Predicted_Usage"
    ] = chart_data.iloc[-1]["Actual_Usage"]

    # Add the target month's prediction
    target_month_row = pd.DataFrame([{
        "Period_Start": target_month["Period_Start"],
        "Month": target_month["Month"],
        "Actual_Usage": np.nan,
        "Predicted_Usage": target_month["Total_Predicted"]
    }])

    chart_data = pd.concat(
        [chart_data, target_month_row],
        ignore_index=True
    )

    return chart_data


if __name__ == "__main__":

    if "--json" in sys.argv:

        # Suppress diagnostic messages from forecasting functions
        with redirect_stdout(StringIO()):

            chart_data = generate_chart_data()
            forecast_data = generate_forecast()

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

        forecast_data = generate_forecast()

        forecast_month = forecast_data.iloc[0]["Month"]

        print(f"\n{forecast_month} Forecast")

        print(
            forecast_data[
                [
                    "Month",
                    "First_Floor_Predicted",
                    "Second_Floor_Predicted",
                    "Total_Predicted",
                    "Predicted_Cost",
                    "Usage_Change_Percent"
                ]
            ].round(2).to_string(index=False)
        )
