import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3001/api/dashboard",
});

// KPI
export const getKPI = async (month) => {
  const response = await API.get("/kpi", {
    params: {
      month,
    },
  });

  return response.data;
};

// Monthly Usage Table
export const getMonthlyUsage = async () => {
  const response = await API.get("/monthly-usage");
  return response.data;
};

// Trend Chart
export const getTrends = async (year) => {
  const response = await API.get("/trends", {
    params: {
      year,
    },
  });

  return response.data;
};

// Floor Comparison
export const getFloorComparison = async (month) => {
  const response = await API.get("/floor-comparison", {
    params: {
      month,
    },
  });

  return response.data;
};



export default API;