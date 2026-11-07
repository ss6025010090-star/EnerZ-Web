import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts";

import { getFloorComparison } from "../../services/dashboardApi";
import "../../styles/floor-chart.css";
import { MdApartment } from "react-icons/md";

function FloorChart({ selectedMonth }) {
  const [floorData, setFloorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFloorData = async () => {
      if (!selectedMonth) return;

      try {
        setLoading(true);
        setError("");

        const data = await getFloorComparison(selectedMonth);
        setFloorData(data);
      } catch (err) {
        setError("Unable to load floor comparison data.");
        setFloorData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFloorData();
  }, [selectedMonth]);

  if (loading) return <p>Loading floor comparison...</p>;
  if (error) return <p>{error}</p>;
  if (!floorData) return <p>Please select a month.</p>;

  const chartData = [
    { name: "First Floor", usage: Number(floorData.first_floor) },
    { name: "Second Floor", usage: Number(floorData.second_floor) },
    
  ];

  const total = Number(floorData.total_kwh);

  const highestFloor = chartData.reduce((highest, floor) =>
    floor.usage > highest.usage ? floor : highest
  );

  const colors = ["#3B82F6", "#10B981"];

  return (
    <div className="floor-comparison">
  
        <div className="floor-comparison-header">
            <div className="background">
                <MdApartment className="floor-title-icon" />
            </div>

            <div className="floor-title-text">
                <h2>Floor Comparison</h2>
                <p>kWh</p>
            </div>
        </div>
  
      
      <div className="floor-bar-section">
        <h3>Electricity Usage by Floor</h3>
  
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            style={{ backgroundColor: "transparent" }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
                cursor={false}
                formatter={(value) => `${Number(value).toLocaleString()} kWh`}
            />
            <Bar
                dataKey="usage"
                name="Usage"
                barSize={60}
                radius={[8, 8, 0, 0]}
                background={{ fill: "transparent" }}
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
  
      
      <div className="floor-charts">
  
        <div className="floor-chart-card">
          <h3>Usage Distribution by Floor</h3>

          <div className="floor-distribution-content">
            <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Pie
                    data={chartData}
                    dataKey="usage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={2}
                >
                    {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index]} />
                    ))}

                    <Label
                    content={({ viewBox }) => {
                        const { cx, cy } = viewBox;

                        return (
                        <g>
                            <text
                            x={cx}
                            y={cy - 15}
                            textAnchor="middle"
                            fill="#777"
                            fontSize="13"
                            >
                            Total
                            </text>
                            <text
                            x={cx}
                            y={cy + 5}
                            textAnchor="middle"
                            fill="#263238"
                            fontSize="16"
                            fontWeight="bold"
                            >
                            {total.toLocaleString()}
                            </text>
                            <text
                            x={cx}
                            y={cy + 25}
                            textAnchor="middle"
                            fill="#777"
                            fontSize="12"
                            >
                            kWh
                            </text>
                        </g>
                        );
                    }}
                    />
                </Pie>
                <Tooltip />
            </PieChart>
            </ResponsiveContainer>
    
            <div className="floor-usage-list">
                {chartData.map((floor, index) => (
                <div className="floor-usage-item" key={floor.name}>
                    <span
                    className="floor-color-dot"
                    style={{ backgroundColor: colors[index] }}
                    />
                    <span>{floor.name}</span>
                    <strong>{floor.usage.toLocaleString()} kWh</strong>
                    <span>
                    {total > 0
                        ? ((floor.usage / total) * 100).toFixed(1)
                        : 0}%
                    </span>
                </div>
                ))}
            </div>
          </div>

        </div>
  
        <div className="floor-chart-card top-floor-card">
          <h3>Top Floor by Usage</h3>
  
          <div className="top-floor-content">
            
            <h2>{highestFloor.name}</h2>
            <h1>{highestFloor.usage.toLocaleString()} kWh</h1>
  
            <p>
              {total > 0
                ? ((highestFloor.usage / total) * 100).toFixed(1)
                : 0}% of total consumption
            </p>
  
            <div className="top-floor-insight">
              {highestFloor.name} has the highest electricity consumption
              for 
              <br/>
              {selectedMonth}.
            </div>
          </div>
  
          <div className="top-floor-total">
            <span>Total Consumption</span>
            <strong>{total.toLocaleString()} kWh</strong>
          </div>
        </div>
  
      </div>
    </div>
  );
}

export default FloorChart;