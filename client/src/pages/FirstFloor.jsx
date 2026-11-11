
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import {
  MdFlashOn,
  MdDevices,
  MdLightbulb,
  MdLightbulbOutline,
  MdSensors,
  MdCheckCircle,
} from "react-icons/md";
import {
  getLatestFloorReading,
  getTodayFloorReadings,
} from "../services/liveMonitoringApi";
import "../styles/first-floor.css";

function FirstFloor() {
    const CACHE_KEY = "floor1_live_readings";

    const [cachedData] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
      } catch {
        return {};
      }
    });
    
    const [latestReading, setLatestReading] = useState(
      cachedData.latestReading ?? null
    );
    
    const [todayReadings, setTodayReadings] = useState(
      Array.isArray(cachedData.todayReadings)
        ? cachedData.todayReadings
        : []
    );
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({
    x: 0,
    y: 0,
    });
  

  // Fetch live Floor 1 data.
  useEffect(() => {
    let isMounted = true;

    const fetchFloorData = async () => {
      try {
        const [latestData, todayData] = await Promise.all([
          getLatestFloorReading(1),
          getTodayFloorReadings(1),
        ]);

        if (!isMounted) return;

        setLatestReading(latestData);
        setTodayReadings(Array.isArray(todayData) ? todayData : []);
        setError("");

        // Save the latest successful data in localStorage.
        localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
            latestReading: latestData,
            todayReadings: Array.isArray(todayData) ? todayData : [],
        })
        );
      } catch (err) {
        console.error("Error fetching Floor 1 data:", err);

        if (isMounted) {
          setError("Unable to load live monitoring data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFloorData();

    // Refresh every 5 minutes.
    // Refresh every 5 seconds.
    const interval = setInterval(fetchFloorData, 5 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Get the two light statuses from the latest reading.
  
// Get the two light statuses from the latest reading.
const lights = useMemo(() => {
    const latestLights = latestReading?.lights ?? [];
  
    return ["LT-1", "LT-2"].map((deviceCode, index) => {
      const light = latestLights.find(
        (item) => item.deviceCode === deviceCode
      );
  
      return {
        deviceCode,
        name: `Light ${index + 1}`,
        status: light?.status ?? "OFF",
        power: Number(light?.power ?? 0),
      };
    });
  }, [latestReading]);
  

  const lightsOn = lights.filter(
    (light) => light.status === "ON"
  ).length;

  const lightsOff = lights.length - lightsOn;

  // Latest sensor values.
  const totalPower = Number(latestReading?.totalPower ?? 0);
  const energyToday = Number(latestReading?.energyToday ?? 0);
  const voltage = Number(latestReading?.voltage ?? 0);
  const current = Number(latestReading?.current ?? 0);



 
  

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Phnom_Penh",
    });


    // Prepare today's chart data.
  // Prepare today's chart data using 15-minute averages.
    const chartData = useMemo(() => {
        const buckets = new Map();
    
        todayReadings.forEach((reading) => {
        const time = new Date(reading.recordedAt);
    
        // Get the start of the 15-minute interval.
        const bucketTime = new Date(time);
        bucketTime.setMinutes(
            Math.floor(bucketTime.getMinutes() / 15) * 15,
            0,
            0
        );
    
        const bucketKey = bucketTime.getTime();
        const power = Number(reading.totalPower ?? 0);
    
        if (!buckets.has(bucketKey)) {
            buckets.set(bucketKey, {
            time: bucketTime,
            totalPower: 0,
            count: 0,
            });
        }
    
        const bucket = buckets.get(bucketKey);
    
        bucket.totalPower += power;
        bucket.count += 1;
        });
    
        return Array.from(buckets.values())
        .map((bucket) => ({
            time: bucket.time,
            power: bucket.totalPower / bucket.count,
        }))
        .sort((a, b) => a.time - b.time);
    }, [todayReadings]);
    


  const chartLeft = 40;
  const chartRight = 1940;
  const chartTop = 20;
  const chartBottom = 200;

  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;


  // Full 24-hour timeline
const dayStart = new Date();
dayStart.setHours(0, 0, 0, 0);

const dayEnd = new Date(dayStart);
dayEnd.setDate(dayEnd.getDate() + 1);

const totalDayDuration = dayEnd.getTime() - dayStart.getTime();

  const maximumPower = Math.max(
    0.15,
    ...chartData.map((item) => item.power)
  );

  const chartMaximum = Math.ceil(maximumPower / 0.05) * 0.05;

  // Calculate the chart points.
  const chartPoints = chartData.map((reading, index) => {
    const x =
    chartLeft +
    ((reading.time.getTime() - dayStart.getTime()) /
        totalDayDuration) *
        chartWidth;

    const y =
      chartBottom -
      (reading.power / chartMaximum) * chartHeight;

    return {
      x,
      y,
      ...reading,
    };

  });

  console.log(
    "Today readings:",
    todayReadings
  );
  
  console.log(
    "Chart X-axis times:",
    chartPoints.map((point) => formatTime(point.time))
  );

  console.log("Total chart points:", chartPoints.length);

  console.log(
    "First chart time:",
    chartPoints.length > 0
      ? formatTime(chartPoints[0].time)
      : "No chart data yet"
  );

  console.log(
    "Last chart time:",
    chartPoints.length > 0
      ? formatTime(chartPoints[chartPoints.length - 1].time)
      : "No chart data yet"
  );

  console.log(
    "Raw database timestamp:",
    todayReadings[todayReadings.length - 1]?.recordedAt
  );
  
  console.log(
    "Browser local time:",
    new Date(todayReadings[todayReadings.length - 1]?.recordedAt).toString()
  );
  
  console.log(
    "Cambodia time:",
    formatTime(
      new Date(todayReadings[todayReadings.length - 1]?.recordedAt)
    )
  );



  const chartLine = chartPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const yAxisLabels = [
    chartMaximum,
    chartMaximum * 0.75,
    chartMaximum * 0.5,
    chartMaximum * 0.25,
    0,
  ];



  return (
    <div className="dashboard">
      <Sidebar />

      <main className="main-content">
        <Header />

        <div className="first-floor-page">

          
          <section className="floor-banner">

            <div className="floor-info-card">
              <div className="floor-info-content">
                <div className="floor-building-icon">
                  <MdDevices />
                </div>

                <div className="floor-info-text">
                  <span>Building Information</span>
                  <h2>Floor 1</h2>
                  <p>2 lighting devices</p>
                </div>
              </div>

              <div className="live-monitoring-badge">
                <span className="live-indicator online"></span>
                Live Monitoring
              </div>
            </div>

            <div className="sensor-info-card">
              <div className="sensor-info-content">
                <div className="sensor-icon">
                  <MdSensors />
                </div>

                <div className="sensor-info-text">
                  <h3>Sensor Information</h3>
                  <p>Energy monitoring sensor</p>
                </div>
              </div>

              <div className={`sensor-online ${error ? "offline" : "online"}`}>
                <span className="online-dot"></span>
                {error ? "Disconnected" : "Connected"}
              </div>
            </div>

          </section>

          
          <section className="floor-kpi-container">

            <div className="floor-kpi-card">
              <div className="kpi-icon power-icon">
                <MdFlashOn />
              </div>

              <div>
                <p>Total Power</p>
                <h2>{totalPower.toFixed(3)} kW</h2>
                <small>Current power consumption</small>
              </div>
            </div>

            <div className="floor-kpi-card">
              <div className="kpi-icon devices-on-icon">
                <MdLightbulb />
              </div>

              <div>
                <p>Devices ON</p>
                <h2>{lightsOn}</h2>
                <small>Active lighting devices</small>
              </div>
            </div>

            <div className="floor-kpi-card">
              <div className="kpi-icon devices-off-icon">
                <MdLightbulbOutline />
              </div>

              <div>
                <p>Devices OFF</p>
                <h2>{lightsOff}</h2>
                <small>Inactive lighting devices</small>
              </div>
            </div>

            <div className="floor-kpi-card">
              <div className="kpi-icon energy-icon">
                <MdFlashOn />
              </div>

              <div>
                <p>Energy Today</p>
                <h2>{energyToday.toFixed(4)} kWh</h2>
                <small>Today's energy consumption</small>
              </div>
            </div>

          </section>

          
          <section className="power-chart-section">

            <div className="chart-header">
              <div>
                <h2>Live Power Usage</h2>
                <p>Real-time power consumption on Floor 1</p>
              </div>

              <div className="chart-filter">
                <button className="active" type="button">
                  Today
                </button>
                <button type="button" disabled>
                  7 Days
                </button>
                <button type="button" disabled>
                  30 Days
                </button>
              </div>
            </div>

            <div className="power-chart">

              
              <div className="chart-y-labels">
                {yAxisLabels.map((value, index) => (
                  <span key={index}>
                    {value.toFixed(2)}
                  </span>
                ))}
              </div>

              
              <div className="chart-content">
                <div className="chart-scroll-container">
                  <div className="chart-scroll-content">

                    <svg
                      className="chart-svg"
                      viewBox="0 0 2000 240"
                      preserveAspectRatio="none"
                    >
                      
                      {yAxisLabels.map((value, index) => {
                        const y =
                          chartTop +
                          (index / (yAxisLabels.length - 1)) *
                            chartHeight;

                        return (
                          <line
                            key={index}
                            x1={chartLeft}
                            y1={y}
                            x2={chartRight}
                            y2={y}
                            className="chart-grid-line"
                          />
                        );
                      })}

                     
                      {chartPoints.slice(1).map((point, index) => {
                        const previousPoint = chartPoints[index];

                        const timeDifference =
                            point.time.getTime() - previousPoint.time.getTime();

                        // Connect points only when they are 15 minutes apart.
                        if (timeDifference !== 15 * 60 * 1000) {
                            return null;
                        }

                        return (
                            <line
                            key={index}
                            x1={previousPoint.x}
                            y1={previousPoint.y}
                            x2={point.x}
                            y2={point.y}
                            className="chart-line"
                            />
                        );
                      })}

                      
                      {chartPoints.map((point, index) => (
                        <circle
                            key={index}
                            cx={point.x}
                            cy={point.y}
                            r="6"
                            className="chart-point"
                            onMouseEnter={(event) => {
                            setHoveredPoint(point);

                            const rect =
                                event.currentTarget.ownerSVGElement.parentElement
                                .getBoundingClientRect();

                                setTooltipPosition({
                                    x: event.clientX,
                                    y: event.clientY,
                                });
                            }}
                            onMouseMove={(event) => {
                            const rect =
                                event.currentTarget.ownerSVGElement.parentElement
                                .getBoundingClientRect();

                                setTooltipPosition({
                                    x: event.clientX,
                                    y: event.clientY,
                                });
                            }}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                      ))}
                    </svg>
                    {hoveredPoint && (
                    <div
                        className="chart-tooltip"
                        style={{
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`,
                        }}
                    >
                        <strong>
                        {formatTime(hoveredPoint.time)} –{" "}
                        {formatTime(
                            new Date(hoveredPoint.time.getTime() + 15 * 60 * 1000)
                        )}
                        {new Date(hoveredPoint.time.getTime() + 15 * 60 * 1000) >
                            new Date() && " (In progress)"}
                        </strong>
                        <p>
                        Power: {Number(hoveredPoint.power).toFixed(3)} kW
                        </p>
                    </div>
                    )}

                    
                    <div className="chart-x-labels">
                    {[
                        "12 AM",
                        "1 AM",
                        "2 AM",
                        "3 AM",
                        "4 AM",
                        "5 AM",
                        "6 AM",
                        "7 AM",
                        "8 AM",
                        "9 AM",
                        "10 AM",
                        "11 AM",
                        "12 PM",
                        "1 PM",
                        "2 PM",
                        "3 PM",
                        "4 PM",
                        "5 PM",
                        "6 PM",
                        "7 PM",
                        "8 PM",
                        "9 PM",
                        "10 PM",
                        "11 PM",
                        "12 AM",
                    ].map((label, index) => (
                        <span
                        key={index}
                        style={{
                            position: "absolute",
                            left: `${chartLeft + (index / 24) * chartWidth}px`,
                            transform: "translateX(-50%)",

                        }}
                        >
                        {label}
                        </span>
                    ))}
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <div className="chart-legend">
              <span className="legend-dot"></span>
              <span>Power Usage (kW)</span>
            </div>

            {chartData.length === 0 && (
              <p className="sample-note">
                Waiting for today's power readings...
              </p>
            )}

          </section>

          
          <section className="floor-bottom-container">

            
            <div className="lighting-section">
              <div className="section-heading">
                <div>
                  <h2>Lighting Devices</h2>
                  <p>Current lighting status on Floor 1</p>
                </div>

                <span className="light-count">
                  {lights.length} Devices
                </span>
              </div>

              <div className="light-card-container">
                {lights.map((light) => (
                  <div className="light-card" key={light.deviceCode}>

                    <div
                      className={`light-icon ${
                        light.status === "ON" ? "light-on" : "light-off"
                      }`}
                    >
                      {light.status === "ON" ? (
                        <MdLightbulb />
                      ) : (
                        <MdLightbulbOutline />
                      )}
                    </div>

                    <div className="light-information">
                      <h3>{light.name}</h3>
                      <p>{light.deviceCode}</p>
                      <small>
                        {light.power.toFixed(3)} kW
                      </small>
                    </div>

                    <span
                      className={`light-status ${
                        light.status === "ON"
                          ? "status-on"
                          : "status-off"
                      }`}
                    >
                      {light.status}
                    </span>

                  </div>
                ))}
              </div>
            </div>

            
            <div className="lighting-summary-section">
              <div className="section-heading">
                <div>
                  <h2>Lighting Summary</h2>
                  <p>Overview of lighting devices</p>
                </div>
              </div>

              <div className="lighting-summary-content">

                <div
                  className="donut-chart"
                  style={{
                    background: `conic-gradient(#16A36A 0% ${(lightsOn / lights.length) * 100}%, #CBD5E1 ${(lightsOn / lights.length) * 100}% 100%)`,
                  }}
                >
                  <div className="donut-chart-inner">
                    <h3>{lightsOn}/{lights.length}</h3>
                    <p>Devices ON</p>
                  </div>
                </div>

                <div className="lighting-legend">
                  <div className="legend-item">
                    <span className="legend-color legend-on"></span>
                    <span>ON</span>
                    <strong>{lightsOn}</strong>
                  </div>

                  <div className="legend-item">
                    <span className="legend-color legend-off"></span>
                    <span>OFF</span>
                    <strong>{lightsOff}</strong>
                  </div>
                </div>

              </div>

              <div className="system-normal-banner">
                <MdCheckCircle />
                <span>Lighting monitoring system is active</span>
              </div>
            </div>

          </section>

        </div>
      </main>
    </div>
  );
}

export default FirstFloor;
