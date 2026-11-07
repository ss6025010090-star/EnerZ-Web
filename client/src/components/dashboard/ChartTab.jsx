import { useState } from "react";

import "../../styles/chart-tab.css";

import {
  MdTrendingUp,
  MdApartment,
  MdBarChart
} from "react-icons/md";

import TrendChart from "./TrendChart";
import FloorChart from "./FloorChart";

function ChartTabs({
  selectedYear,
  selectedMonth
}) {

  const [activeTab, setActiveTab] = useState("trend");

  return (

    <div className="chart-container">

      

      <div className="chart-tabs">

        

        <button
          className={
            activeTab === "trend"
              ? "tab active"
              : "tab"
          }
          onClick={() => setActiveTab("trend")}
        >

          <MdTrendingUp size={20} />

          <span>Trend</span>

        </button>


        

        <button
          className={
            activeTab === "floor"
              ? "tab active"
              : "tab"
          }
          onClick={() => setActiveTab("floor")}
        >

          <MdApartment size={20} />

          <span>Floor</span>

        </button>

        

      </div>


      <div className="chart-body">


        {activeTab === "trend" && (

          <TrendChart
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />

        )}

        {activeTab === "floor" && (
          <FloorChart selectedMonth={selectedMonth} />
        )}


      </div>

    </div>

  );

}

export default ChartTabs;