import { useState, useEffect } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import "../styles/dashboard.css";
import KPICard from "../components/dashboard/KPICard";
import { getKPI } from "../services/dashboardApi";
import ChartSwitch from "../components/dashboard/ChartSwitch";
import ChartTab from "../components/dashboard/ChartTab";
import TrendChart from "../components/dashboard/TrendChart";

import {

    MdBolt,

    MdAttachMoney,

    MdApartment,

    MdTrendingUp

} from "react-icons/md";

function Dashboard() {

  const months = {
    2026: [
      "Jan-26",
      "Feb-26",
      "Mar-26",
      "Apr-26",
      "May-26",
      "Jun-26",
      "Jul-26",
      "Aug-26",
      "Sep-26",
      "Oct-26",
      "Nov-26"
    ],

    2025: [
      "Jan-25",
      "Feb-25",
      "Mar-25",
      "Apr-25",
      "May-25",
      "Jun-25",
      "Jul-25",
      "Aug-25",
      "Sep-25",
      "Oct-25",
      "Nov-25",
      "Dec-25"
    ],

    2024: [
      "Jan-24",
      "Feb-24",
      "Mar-24",
      "Apr-24",
      "May-24",
      "Jun-24",
      "Jul-24",
      "Aug-24",
      "Sep-24",
      "Oct-24",
      "Nov-24",
      "Dec-24"
    ],

    2023: [
      "Jan-23",
      "Feb-23",
      "Mar-23",
      "Apr-23",
      "May-23",
      "Jun-23",
      "Jul-23",
      "Aug-23",
      "Sep-23",
      "Oct-23",
      "Nov-23",
      "Dec-23"
    ]
  };

  const [selectedYear, setSelectedYear] = useState("2026");

  const [selectedMonth, setSelectedMonth] = useState("Nov-26");

  const [kpiData, setKpiData] = useState(null);

  const [view, setView] = useState("chart");

  useEffect(() => {
    const loadKPI = async () => {
      try {
        const data = await getKPI(selectedMonth);
  
        console.log("KPI Response:", data);
  
        setKpiData(data);
      } catch (error) {
        console.error(error);
      }
    };
  
    loadKPI();
  }, [selectedMonth]);

  return (
    <div className="dashboard">

      <Sidebar />

      <div className="main-content">

        <Header />

        <div className="filter-bar">

          <div className="filter-group">

            <label>Year</label>

            <select
              value={selectedYear}
              onChange={(e) => {
                const year = e.target.value;

                setSelectedYear(year);

                setSelectedMonth(`Jan-${year.slice(2)}`);
              }}
            >

              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>

            </select>

          </div>

          <div className="filter-group">

            <label>Month</label>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >

              {months[selectedYear].map((month) => (

                <option
                  key={month}
                  value={month}
                >
                  {month}
                </option>

              ))}

            </select>

          </div>

        </div>

        <div className="kpi-container">

            <KPICard

                title="Total Consumption"
                value={kpiData?.total_kwh ?? "-"}
                unit="kWh"
                subtitle={`${kpiData?.change_percent ?? 0}% vs last month`}
                icon={<MdBolt />}
                iconColor="#1565C0"
                iconBackground="#D9ECFF"
                valueColor="#1565C0"

            />

            <KPICard

                title="Monthly Cost"
                value={kpiData?.expense ?? "-"}
                subtitle="Based on $0.158/kWh"
                icon={<MdAttachMoney />}
                iconColor="#2E7D32"
                iconBackground="#DDEFD9"
                valueColor="#2E7D32"

            />

            <KPICard

                title="Active Floor"
                value="2"
                subtitle="All floors monitored"
                icon={<MdApartment />}
                iconColor="#D97706"
                iconBackground="#FDEBD2"
                valueColor="#f28a0b"

            />

            <KPICard

                title="Average Usage"

                value={
                    kpiData
                      ? Number(kpiData.average_daily_usage).toFixed(2)
                      : "-"
                }

                unit="kWh"
                subtitle="Per Day"
                icon={<MdTrendingUp />}
                iconColor="#C026D3"
                iconBackground="#F9D8FF"
                valueColor="1565C0"

            />

        </div>
        <div className="chart-section">

            <ChartSwitch
                view={view}
                setView={setView}
            />

            <div className="contain-chart">
                {
                view === "chart"
                    ? (
                        <ChartTab
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        />
                    )
                    : <UsageTable />
                }
            </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;