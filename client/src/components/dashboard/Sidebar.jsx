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

import logo from "../../assets/logo.svg";

function Sidebar() {
  return (
    <aside className="sidebar">

      

      <div className="logo">

       

        <div className="header-brand">
        <img
          src={logo}
          alt="Logo"
          className="header-logo"
        />

          <h2>EnerZ</h2>
          
        </div>

      </div>

     

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

          <NavLink to="/ai-forecasting" className="menu-item">
            <RiRobot2Line className="icon"/>
            <span>AI Forecasting</span>
          </NavLink>

          

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