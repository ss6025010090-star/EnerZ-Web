import "../../styles/chart-switch.css";
import { MdOutlineInsertChart, MdOutlineTableRows } from "react-icons/md";

function ChartSwitch({ view, setView }) {
  return (
    <div className="chart-switch">

      <button
        className={view === "chart" ? "switch-btn active" : "switch-btn"}
        onClick={() => setView("chart")}
      >Chart View
        <MdOutlineInsertChart size={20} />
        
      </button>

      <button
        className={view === "table" ? "switch-btn active" : "switch-btn"}
        onClick={() => setView("table")}
      >Usage Record
        <MdOutlineTableRows size={20} />
        
      </button>

    </div>
  );
}

export default ChartSwitch;