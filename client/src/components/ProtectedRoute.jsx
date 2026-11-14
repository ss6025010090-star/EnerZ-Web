
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  // Get current session and listen for authentication changes
  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (mounted) {
        setSession(error ? null : data.session);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Verify CamTech email
  useEffect(() => {
    let mounted = true;

    const verifyUser = async () => {
      if (session === undefined) return;

      setChecking(true);

      if (!session) {
        setAuthorized(false);
        setChecking(false);
        return;
      }

      const user = session.user;
      const email = user?.email?.toLowerCase() || "";

      const isCamTechEmail =
        email.endsWith("@camtech.edu.kh");

      const isVerified =
        Boolean(user?.email_confirmed_at);

      if (!isCamTechEmail || !isVerified) {
        if (mounted) {
          setAuthorized(false);
          setChecking(false);
        }

        await supabase.auth.signOut();
        return;
      }

      if (mounted) {
        setAuthorized(true);
        setChecking(false);
      }
    };

    verifyUser();

    return () => {
      mounted = false;
    };
  }, [session]);

  if (checking || session === undefined) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#64748B",
        }}
      >
        Checking authentication...
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/login?error=domain" replace />;
  }

  return children;
}

export default ProtectedRoute;
