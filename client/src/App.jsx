import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import FirstFloor from "./pages/FirstFloor";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route path="/first-floor" element={<FirstFloor />} />

        <Route
          path="/second-floor"
          element={<h1></h1>}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;