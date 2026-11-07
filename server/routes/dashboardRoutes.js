import express from "express";

import {
  getMonthlyUsage,
  getKPI,
  getTrends,
  getFloorComparison,
  getMeterComparison
} from "../controllers/dashboardController.js";

const router = express.Router();

// Usage Records
router.get("/monthly-usage", getMonthlyUsage);

// KPI Cards
router.get("/kpi", getKPI);

// Trend Chart
router.get("/trends", getTrends);

// Floor Comparison Chart
router.get("/floor-comparison", getFloorComparison);

//Meter Comparison Chart
router.get("/meter-comparison", getMeterComparison);

export default router;