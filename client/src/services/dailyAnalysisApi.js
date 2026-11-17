
import axios from "axios";

const API_URL =
  "http://localhost:3001/api/recommendations/daily-analysis";

export const getDailyAnalysis = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};
