
import express from "express";

import {
  getRecommendations,
  getDailyAnalysis
} from "../controllers/recommendationController.js";

const router = express.Router();

// Energy recommendations
router.get("/", getRecommendations);

// Daily energy analysis
router.get("/daily-analysis", getDailyAnalysis);

export default router;
