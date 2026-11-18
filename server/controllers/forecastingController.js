
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pool from "../config/db.js";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Python forecasting directory
const forecastingDir = path.resolve(
  __dirname,
  "../services/forecasting"
);

// Python virtual environment
const pythonPath = path.join(
  forecastingDir,
  "venv",
  "bin",
  "python"
);

export const getForecastingData = async (req, res) => {
  try {
    // 1. Execute Python forecasting model
    const { stdout } = await execFileAsync(
      pythonPath,
      [
        "-m",
        "services.forecasting.predict",
        "--json"
      ],
      {
        cwd: path.resolve(forecastingDir, "../.."),
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024
      }
    );

    // 2. Convert Python JSON into JavaScript data
    const forecastData = JSON.parse(stdout);

    // 3. Get the latest forecast
    const latestForecast = forecastData.forecast?.[0];

    if (!latestForecast) {
      return res.status(500).json({
        message: "No forecasting result was generated."
      });
    }

    // 4. Save forecast into PostgreSQL
    await pool.query(
      `
      INSERT INTO electricity_forecasts (
        forecast_month,
        first_floor_predicted,
        second_floor_predicted,
        total_predicted,
        predicted_cost,
        usage_change_percent
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (forecast_month)
      DO UPDATE SET
        first_floor_predicted = EXCLUDED.first_floor_predicted,
        second_floor_predicted = EXCLUDED.second_floor_predicted,
        total_predicted = EXCLUDED.total_predicted,
        predicted_cost = EXCLUDED.predicted_cost,
        usage_change_percent = EXCLUDED.usage_change_percent,
        created_at = CURRENT_TIMESTAMP
      `,
      [
        latestForecast.Period_Start,
        latestForecast.First_Floor_Predicted,
        latestForecast.Second_Floor_Predicted,
        latestForecast.Total_Predicted,
        latestForecast.Predicted_Cost,
        latestForecast.Usage_Change_Percent
      ]
    );

    // 5. Return forecast data to React
    return res.status(200).json(forecastData);

  } catch (error) {
    console.error(
      "Forecasting API error:",
      error.stderr || error
    );

    return res.status(500).json({
      message: "Failed to generate forecasting data.",
      error: error.message
    });
  }
};
