
import { useEffect, useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import KPICard from "../components/dashboard/KPICard";

import { getForecastingData } from "../services/forecastingApi";

import {
  MdBolt,
  MdTrendingUp,
  MdAttachMoney,
  MdLightbulb
} from "react-icons/md";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

import "../styles/dashboard.css";
import "../styles/AIForecasting.css";

const FLOOR_COLORS = ["#2563EB", "#10B981"];

// Format numbers
const formatNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
};

// Format currency
const formatCurrency = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? `$${number.toFixed(2)}`
    : "$0.00";
};

// Format percentage
const formatPercentage = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return "0.00%";

  return `${number > 0 ? "+" : ""}${number.toFixed(2)}%`;
};

// Custom chart tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="forecast-tooltip">
      <p className="tooltip-month">{label}</p>

      {payload.map((item) => {
        if (item.value === null || item.value === undefined) {
          return null;
        }

        return (
          <p key={item.dataKey} style={{ color: item.color }}>
            {item.name}: {formatNumber(item.value)} kWh
          </p>
        );
      })}
    </div>
  );
};

function AIForecasting() {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch forecasting data from backend
  useEffect(() => {
    const fetchForecastingData = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getForecastingData();

        setForecastData(data);
      } catch (err) {
        console.error("Forecasting data error:", err);
        setError(
          "Unable to load AI forecasting data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchForecastingData();
  }, []);

  // Forecasting data
  const chartData = forecastData?.chart || [];
  const predictions = forecastData?.forecast || [];

  // Get latest actual usage
  const latestActual = [...chartData]
    .reverse()
    .find(
      (item) =>
        item.Actual_Usage !== null &&
        item.Actual_Usage !== undefined
    );

  // Get next month's prediction
  const nextPrediction = predictions[0];

  // Floor energy distribution
  const floorDistribution = nextPrediction
    ? [
        {
          name: "First Floor",
          value: Number(nextPrediction.First_Floor_Predicted) || 0
        },
        {
          name: "Second Floor",
          value: Number(nextPrediction.Second_Floor_Predicted) || 0
        }
      ]
    : [];

  // Calculate total floor usage
  const totalFloorUsage = floorDistribution.reduce(
    (total, floor) => total + floor.value,
    0
  );

  // Calculate floor percentage
  const getFloorPercentage = (value) => {
    if (totalFloorUsage === 0) return 0;

    return (value / totalFloorUsage) * 100;
  };

  const chartStartMonth = chartData[0]?.Month || "January";
  const chartEndMonth =
    chartData[chartData.length - 1]?.Month || "December";

  // Loading state
  if (loading) {
    return (
      <div className="dashboard ai-forecasting-page">
        <Sidebar />

        <div className="main-content">
          <Header />

          <div className="forecast-message">
            <div className="forecast-spinner"></div>
            <p>Loading AI forecasting data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard ai-forecasting-page">
        <Sidebar />

        <div className="main-content">
          <Header />

          <div className="forecast-message forecast-error">
            <h3>Forecasting Data Unavailable</h3>
            <p>{error}</p>

            <button
              className="forecast-retry-btn"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard ai-forecasting-page">
      <Sidebar />

      <div className="main-content">
        <Header />

        

        <div className="forecast-page-heading">
          

          <div className="forecast-status">
            <span className="forecast-status-dot"></span>
            AI Prediction Active
          </div>
        </div>

        

        <div className="kpi-container">
          <KPICard
            title="This Month's Usage"
            value={formatNumber(latestActual?.Actual_Usage)}
            unit="kWh"
            subtitle={latestActual?.Month || "Latest actual month"}
            icon={<MdBolt />}
            iconColor="#1565C0"
            iconBackground="#D9ECFF"
            valueColor="#1565C0"
          />

          <KPICard
            title="Next Month Forecast"
            value={formatNumber(nextPrediction?.Total_Predicted)}
            unit="kWh"
            subtitle={nextPrediction?.Month || "Predicted month"}
            icon={<MdBolt />}
            iconColor="#2E7D32"
            iconBackground="#DDEFD9"
            valueColor="#2E7D32"
          />

          <KPICard
            title="Predicted Cost"
            value={formatCurrency(nextPrediction?.Predicted_Cost)}
            subtitle="At $0.158 per kWh"
            icon={<MdAttachMoney />}
            iconColor="#D97706"
            iconBackground="#FDEBD2"
            valueColor="#D97706"
          />

          <KPICard
            title="Expected Usage Change"
            value={formatPercentage(nextPrediction?.Usage_Change_Percent)}
            subtitle="vs. last actual month"
            icon={<MdTrendingUp />}
            iconColor="#9333EA"
            iconBackground="#F3E8FF"
            valueColor="#9333EA"
          />
        </div>

        

        <div className="chart-section">
          <div className="contain-chart">

            <div className="forecast-chart-header">
              <div>
                <h3>Electricity Usage Forecast</h3>
                <p>
                  Compare actual electricity consumption with AI predictions.
                </p>
              </div>

              <span className="forecast-chart-period">
                {chartStartMonth} – {chartEndMonth} 2026
              </span>
            </div>

            

            <div className="forecast-chart-legend">
              <div className="legend-item">
                <span className="legend-line actual-line"></span>
                <span>Actual Usage</span>
              </div>

              <div className="legend-item">
                <span className="legend-line predicted-line"></span>
                <span>Predicted Usage</span>
              </div>
            </div>

            

            <div className="forecast-chart">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 15,
                      right: 25,
                      left: 5,
                      bottom: 5
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5E7EB"
                    />

                    <XAxis
                      dataKey="Month"
                      tick={{ fill: "#64748B", fontSize: 12 }}
                      axisLine={{ stroke: "#CBD5E1" }}
                      tickLine={false}
                    />

                    <YAxis
                      tick={{ fill: "#64748B", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `${value}`}
                      domain={[0, "auto"]}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Line
                      type="monotone"
                      dataKey="Actual_Usage"
                      name="Actual Usage"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#2563EB" }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="Predicted_Usage"
                      name="Predicted Usage"
                      stroke="#10B981"
                      strokeWidth={3}
                      strokeDasharray="7 5"
                      dot={{ r: 4, fill: "#10B981" }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="forecast-empty">
                  No chart data is available.
                </div>
              )}
            </div>

            

            <p className="forecast-chart-note">
              The predicted line starts from the latest actual usage and
              continues with the AI-generated prediction.
            </p>

          </div>
        </div>

        

        <div className="chart-section floor-distribution-section">
          <div className="contain-chart">

            <div className="forecast-chart-header">
              <div>
                <h3>Floor Energy Distribution</h3>
                <p>
                  Predicted electricity consumption by floor for{" "}
                  {nextPrediction?.Month || "the next month"}.
                </p>
              </div>
            </div>

            <div className="floor-distribution-card">

              

              <div className="floor-donut-chart">
                {totalFloorUsage > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={floorDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={105}
                          paddingAngle={4}
                        >
                          {floorDistribution.map((floor, index) => (
                            <Cell
                              key={floor.name}
                              fill={FLOOR_COLORS[index]}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(value) => [
                            `${formatNumber(value)} kWh`,
                            "Predicted Usage"
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="floor-donut-center">
                      <span>Total Predicted</span>
                      <strong>
                        {formatNumber(totalFloorUsage)}
                      </strong>
                      <small>kWh</small>
                    </div>
                  </>
                ) : (
                  <div className="forecast-empty">
                    No floor prediction data is available.
                  </div>
                )}
              </div>

              

              <div className="floor-distribution-details">
                {floorDistribution.map((floor, index) => (
                  <div
                    className="floor-distribution-item"
                    key={floor.name}
                  >
                    <div className="floor-distribution-info">
                      <div className="floor-name">
                        <span
                          className="floor-color-dot"
                          style={{
                            backgroundColor: FLOOR_COLORS[index]
                          }}
                        ></span>

                        <strong>{floor.name}</strong>
                      </div>

                      <strong>
                        {getFloorPercentage(floor.value).toFixed(2)}%
                      </strong>
                    </div>

                    <div className="floor-usage-value">
                      {formatNumber(floor.value)} kWh
                    </div>

                    <div className="floor-progress-track">
                      <div
                        className="floor-progress-fill"
                        style={{
                          width: `${getFloorPercentage(floor.value)}%`,
                          backgroundColor: FLOOR_COLORS[index]
                        }}
                      ></div>
                    </div>
                  </div>
                ))}

                <div className="floor-distribution-note">
                  <MdLightbulb />
                  <span>
                    These values are generated by the AI forecasting model.
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AIForecasting;
