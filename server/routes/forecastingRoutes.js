
import express from "express";

import {
  getForecastingData
} from "../controllers/forecastingController.js";

const router = express.Router();

// AI Forecasting
router.get("/", getForecastingData);

export default router;
