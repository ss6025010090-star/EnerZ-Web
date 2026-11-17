
import axios from "axios";

const API_URL = "http://localhost:3001/api/recommendations";

export const getRecommendations = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error(
      "Failed to fetch energy recommendations:",
      error
    );

    throw error;
  }
};
