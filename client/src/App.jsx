
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import FirstFloor from "./pages/FirstFloor";
import SecondFloor from "./pages/SecondFloor";
import AIForecasting from "./pages/AIForecasting";

import Login from "./pages/Login";
import ActionPlans from "./pages/ActionPlans";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        
        <Route path="/login" element={<Login />} />

        
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

       
        <Route
          path="/ai-forecasting"
          element={
            <ProtectedRoute>
              <AIForecasting />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/action-plans" 
          element={
            <ProtectedRoute>
              <ActionPlans />
            </ProtectedRoute>

          } 
        />

        
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
