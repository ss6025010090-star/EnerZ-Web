
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server directory
const serverDir = path.resolve(__dirname, "..");

// Reuse the existing Python virtual environment
const pythonPath = path.join(
  serverDir,
  "services",
  "forecasting",
  "venv",
  "bin",
  "python"
);

export const getRecommendations = async (req, res) => {
  try {
    const { stdout } = await execFileAsync(
      pythonPath,
      [
        "-m",
        "services.analysis.recommendation_engine",
        "--json"
      ],
      {
        cwd: serverDir,
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024
      }
    );

    const recommendationData = JSON.parse(stdout);

    res.status(200).json(recommendationData);

  } catch (error) {
    console.error(
      "Recommendation API error:",
      error.stderr || error
    );

    res.status(500).json({
      message: "Failed to generate energy recommendations."
    });
  }
};


export const getDailyAnalysis = async (req, res) => {
    try {
      const { stdout } = await execFileAsync(
        pythonPath,
        [
          "-m",
          "services.analysis.energy_analysis"
        ],
        {
          cwd: serverDir,
          timeout: 60000,
          maxBuffer: 10 * 1024 * 1024
        }
      );
  
      const analysisData = JSON.parse(stdout);
  
      res.status(200).json(analysisData);
  
    } catch (error) {
      console.error(
        "Daily Analysis API error:",
        error.stderr || error
      );
  
      res.status(500).json({
        message: "Failed to generate daily energy analysis."
      });
    }
  };
  
