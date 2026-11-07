import "../../styles/sidebar.css";
import { NavLink } from "react-router-dom";

import {
  MdDashboard,
  MdOutlineLightbulb,
} from "react-icons/md";

import {
  FaBuilding
} from "react-icons/fa";

import {
  RiRobot2Line
} from "react-icons/ri";

import {
  HiOutlineChartBar
} from "react-icons/hi";

function Sidebar() {
  return (
    <aside className="sidebar">

      {/* Logo */}

      <div className="logo">

       

        <div>
          <h2>EnerZ</h2>
          
        </div>

      </div>

      {/* Menu */}

      <nav className="sidebar-menu">

        <div className="menu-section">

          <p className="menu-title">
            Overview
          </p>

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <MdDashboard className="icon" />
            <span>Dashboard</span>
          </NavLink>

        </div>

        <div className="menu-section">

          <p className="menu-title">
            Building
          </p>

          <NavLink
            to="/first-floor"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <FaBuilding className="icon" />
            <span>First Floor</span>
          </NavLink>

          <NavLink
            to="/second-floor"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <FaBuilding className="icon" />
            <span>Second Floor</span>
          </NavLink>

          

        </div>

        <div className="menu-section">

          <p className="menu-title">
            AI Insight
          </p>

          <button className="menu-item">

            <RiRobot2Line className="icon"/>

            <span>AI Forecasting</span>

          </button>

          <button className="menu-item">

            <HiOutlineChartBar className="icon"/>

            <span>Prediction History</span>

          </button>

        </div>

        <div className="menu-section">

          <p className="menu-title">
            Action
          </p>

          <button className="menu-item">

            <MdOutlineLightbulb className="icon"/>

            <span>Action Plan</span>

          </button>

        </div>

      </nav>

    </aside>
  );
}

export default Sidebar;