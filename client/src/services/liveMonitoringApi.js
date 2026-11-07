import axios from "axios";

const API_URL = "http://localhost:3001/api/live-readings";

// Get the latest reading for a floor
export const getLatestFloorReading = async (floorNumber) => {
  const response = await axios.get(
    `${API_URL}/${floorNumber}/latest`
  );

  return response.data;
};

// Get all readings for today
export const getTodayFloorReadings = async (floorNumber) => {
  const response = await axios.get(
    `${API_URL}/${floorNumber}/today`
  );

  return response.data;
};