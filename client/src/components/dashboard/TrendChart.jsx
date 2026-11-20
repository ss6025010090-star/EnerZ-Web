import { useEffect, useState } from "react";
import { getTrends } from "../../services/dashboardApi";
import { MdBolt, MdAttachMoney } from "react-icons/md";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

import "../../styles/trend-chart.css";

function TrendChart({ selectedYear, selectedMonth }) {

  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const loadTrends = async () => {

      try {

        setLoading(true);

        const data = await getTrends(selectedYear);

        console.log("Trend Response:", data);

        setTrendData(data);

      } catch (error) {

        console.error("Failed to load trend data:", error);

        setTrendData([]);

      } finally {

        setLoading(false);

      }

    };

    loadTrends();

  }, [selectedYear]);


  if (loading) {

    return (
      <div className="chart-container">

        <div className="chart-loading">
          Loading chart...
        </div>

      </div>
    );

  }


  if (trendData.length === 0) {

    return (
      <div className="chart-container">

        <div className="chart-empty">
          No trend data available.
        </div>

      </div>
    );

  }


  return (

    <div className="chart-container">


      <div className="chart-block">

        <div className="chart-title">

        <div
            className="chart-icon"
            style={{
            background: "#D9ECFF",
            color: "#1565C0"
            }}
        >
            <MdBolt size={24} />
        </div>

          <div>

            <h3>Monthly Electricity Usage</h3>

            <span>kWh</span>

          </div>

        </div>


        <div className="chart-wrapper">

          <ResponsiveContainer width="100%" height={350}>

            <AreaChart data={trendData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="month"
              />

              <YAxis />

              <Tooltip
                cursor={{
                  stroke: "#94A3B8",
                  strokeWidth: 1,
                  strokeDasharray: "5 5"
                }}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)"
                }}
                labelStyle={{
                  color: "#64748B",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "6px"
                }}
                itemStyle={{
                  color: "#1565C0",
                  fontSize: "14px",
                  fontWeight: 700
                }}
                formatter={(value) => [
                  `${Number(value).toLocaleString()} kWh`,
                  "Electricity Usage"
                ]}
                labelFormatter={(label) => `Month: ${label}`}
              />

              <Area
                type="monotone"
                dataKey="total_kwh"
                stroke="#5B9BD5"
                fill="#DCEAF7"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 7,
                  fill: "#FFFFFF",
                  stroke: "#2563EB",
                  strokeWidth: 3
                }}
                activeDotAnimation={false}
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </div>


      

      <div className="chart-block cost-chart">

        <div className="chart-title">

        <div
            className="chart-icon"
            style={{
            background: "#DDEFD9",
            color: "#2E7D32"
            }}
        >
            <MdAttachMoney size={24} />
        </div>

          <div>

            <h3>Monthly Electricity Costs</h3>

            <span>USD</span>

          </div>

        </div>


        <div className="chart-wrapper">

          <ResponsiveContainer width="100%" height={350}>

            <AreaChart data={trendData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="month"
              />

              <YAxis />

              <Tooltip
                cursor={{
                  stroke: "#94A3B8",
                  strokeWidth: 1,
                  strokeDasharray: "5 5"
                }}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)"
                }}
                labelStyle={{
                  color: "#64748B",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "6px"
                }}
                itemStyle={{
                  color: "#2E7D32",
                  fontSize: "14px",
                  fontWeight: 700
                }}
                formatter={(value) => [
                  `$${Number(value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}`,
                  "Electricity Cost"
                ]}
                labelFormatter={(label) => `Month: ${label}`}
              />

              <Area
                type="monotone"
                dataKey="expense"
                stroke="#4F8A38"
                fill="#E5F0E1"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 7,
                  fill: "#FFFFFF",
                  stroke: "#2E7D32",
                  strokeWidth: 3
                }}
                activeDotAnimation={false}
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>

  );

}

export default TrendChart;