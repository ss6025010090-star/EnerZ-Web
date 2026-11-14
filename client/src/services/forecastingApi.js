
import axios from "axios";

const API_URL = "http://localhost:3001/api/forecasting";

export const getForecastingData = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error(
      "Failed to fetch forecasting data:",
      error
    );

    throw error;
  }
};
