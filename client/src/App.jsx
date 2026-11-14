
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import FirstFloor from "./pages/FirstFloor";
import SecondFloor from "./pages/SecondFloor";
import AIForecasting from "./pages/AIForecasting";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login page */}
        <Route path="/login" element={<Login />} />

        {/* Protected dashboard pages */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/first-floor"
          element={
            <ProtectedRoute>
              <FirstFloor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/second-floor"
          element={
            <ProtectedRoute>
              <SecondFloor />
            </ProtectedRoute>
          }
        />

        {/* AI Forecasting page */}
        <Route
          path="/ai-forecasting"
          element={
            <ProtectedRoute>
              <AIForecasting />
            </ProtectedRoute>
          }
        />

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
