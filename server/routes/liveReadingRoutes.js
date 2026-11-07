import express from "express";

import {
  getLatestFloorReading,
  getTodayFloorReadings,
} from "../controllers/liveReadingController.js";

const router = express.Router();

// Get the latest reading for a floor
router.get("/:floorNumber/latest", getLatestFloorReading);

// Get all readings for today
router.get("/:floorNumber/today", getTodayFloorReadings);

export default router;