import forecastingRoutes from "./routes/forecastingRoutes.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import pool from "./config/db.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import liveReadingRoutes from "./routes/liveReadingRoutes.js";
import { startLiveDataSimulator } from "./services/liveDataSimulator.js";
import { startMqttService } from "./services/mqttService.js";
import { startMqttTestPublisher } from "./services/mqttTestPublisher.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Database connected successfully!",
      time: result.rows[0].now,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed."
    });
  }
});

// Dashboard APIs
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/live-readings", liveReadingRoutes);
app.use("/api/forecasting", forecastingRoutes);

const PORT = process.env.PORT || 5000;

// Backend health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "EnerSight backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  const DATA_SOURCE = process.env.DATA_SOURCE || "simulation";

  if (DATA_SOURCE === "simulation") {
    console.log("Using simulated live data.");
    startLiveDataSimulator();
  } else if (DATA_SOURCE === "mqtt") {
    console.log("Using MQTT live data.");
  
    startMqttService();
    startMqttTestPublisher();
  } else {
    console.error("Invalid DATA_SOURCE. Use 'simulation' or 'mqtt'.");
  }
});