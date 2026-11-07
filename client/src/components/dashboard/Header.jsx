import "../../styles/header.css";

import { IoNotificationsOutline } from "react-icons/io5";
import { FiSettings } from "react-icons/fi";

function Header() {
  return (
    <header className="header">

      <div className="header-left">
        <h1>Dashboard</h1>
        
      </div>

      <div className="header-right">

        <button className="icon-button">
          <IoNotificationsOutline size={22} />
          <span className="notification-dot"></span>
        </button>

        <button className="icon-button">
          <FiSettings size={20} />
        </button>

      </div>

    </header>
  );
}

export default Header;