import { MdPublic, MdBolt, MdWifi } from "react-icons/md";
import { useState } from "react";
import { supabase } from "../config/supabaseClient";
import { FcGoogle } from "react-icons/fc";
import { FiShield } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import "../styles/Login.css";

function Login() {
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [searchParams] = useSearchParams();

  const errorType = searchParams.get("error");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoginError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setLoginError(error.message);
        setLoading(false);
      }
    } catch (error) {
      console.error("Google login error:", error);
      setLoginError("Unable to connect to Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        
      <div className="login-left">


        <div className="login-feature-icons">

        <div className="feature-icon internet-icon">
            <MdPublic />
        </div>

        <div className="feature-icon power-feature-icon">
            <MdBolt />
        </div>

        <div className="feature-icon wifi-icon">
            <MdWifi />
        </div>

      </div>

        
        <img
        src="/EnerZ.svg"
        alt="EnerZ"
        className="login-logo"
        />

    </div>

        
        <div className="login-right">
          <div className="login-form">

                 
            <div className="login-heading">
              <h2>Welcome</h2>
              <p>
                Sign in to continue to your EnerSight dashboard.
              </p>
            </div>

            
            <div className="login-access-info">
              <div className="login-access-icon">
                <FiShield size={19} />
              </div>

              <div className="login-access-text">
                <strong>University Account</strong>
                <p>
                  Use your verified CamTech Google account.
                </p>
              </div>
            </div>

            
            {errorType === "domain" && (
              <div className="login-error" role="alert">
                Access denied. Please use your verified
                CamTech university Google account.
              </div>
            )}

            
            {loginError && (
              <div className="login-error" role="alert">
                {loginError}
              </div>
            )}

            
            <button
              type="button"
              className="google-login-button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <FcGoogle size={21} />

              <span>
                {loading ? "Connecting..." : "Continue with Google"}
              </span>
            </button>

            
            <p className="login-footer">
            © 2026 EnerSight. All rights reserved.
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
