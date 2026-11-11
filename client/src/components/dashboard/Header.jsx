
import { useEffect, useState } from "react";
import "../../styles/header.css";

import { IoNotificationsOutline } from "react-icons/io5";
import {
  FiSettings,
  FiClock,
  FiUser,
  FiChevronDown,
  FiLogOut,
} from "react-icons/fi";

import { supabase } from "../../config/supabaseClient";

function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check authentication status
  useEffect(() => {
    let mounted = true;

    const getUserSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!error && mounted) {
        setUser(data.session?.user ?? null);
      }
    };

    getUserSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Google Login
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  
    if (error) {
      console.error("Google login failed:", error.message);
      alert("Unable to sign in with Google. Please try again.");
    }
  };

  // Logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      return;
    }

    setShowProfile(false);
  };

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Phnom_Penh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(currentTime);

  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Phnom_Penh",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(currentTime);

  const avatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture;

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "User";

  return (
    <header className="header">
      <div className="header-left">
        <h1>Dashboard</h1>
      </div>

      <div className="header-right">
        {/* Date and Time */}
        <div className="header-datetime">
          <FiClock className="clock-icon" size={20} />

          <div className="datetime-text">
            <div className="header-time">{time}</div>
            <div className="header-date">{date}</div>
          </div>
        </div>

        {/* Notifications */}
        <button className="icon-button">
          <IoNotificationsOutline size={22} />
          <span className="notification-dot"></span>
        </button>

        {/* Settings */}
        <button className="icon-button">
          <FiSettings size={20} />
        </button>

        {/* Login or User Profile */}
        {!user ? (
          <button
            className="header-login-button"
            onClick={handleGoogleLogin}
          >
            Log In
          </button>
        ) : (
          <div className="header-profile-container">
            <button
              className="header-profile-button"
              onClick={() => setShowProfile(!showProfile)}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="Google profile"
                  className="header-avatar"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <FiUser size={22} />
              )}

              <span className="header-profile-name">
                {displayName}
              </span>

              <FiChevronDown size={16} />
            </button>

            {showProfile && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <strong>{displayName}</strong>
                  <span>{user.email}</span>
                </div>

                <div className="profile-divider"></div>

                <button
                  className="logout-button"
                  onClick={handleLogout}
                >
                  <FiLogOut size={18} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
