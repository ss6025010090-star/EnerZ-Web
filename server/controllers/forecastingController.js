
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

// Get the current controller directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Python forecasting paths
const forecastingDir = path.resolve(
  __dirname,
  "../services/forecasting"
);

const pythonPath = path.join(
  forecastingDir,
  "venv",
  "bin",
  "python"
);

const scriptPath = path.join(
  forecastingDir,
  "predict.py"
);

export const getForecastingData = async (req, res) => {
  try {
    // Execute the Python forecasting script
    const { stdout } = await execFileAsync(
      pythonPath,
      [scriptPath, "--json"],
      {
        cwd: forecastingDir,
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024
      }
    );

    // Convert Python JSON output into JavaScript data
    const forecastData = JSON.parse(stdout);

    res.status(200).json(forecastData);

  } catch (error) {
    console.error(
      "Forecasting API error:",
      error.stderr || error
    );

    res.status(500).json({
      message: "Failed to generate forecasting data."
    });
  }
};
