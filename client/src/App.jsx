import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import FirstFloor from "./pages/FirstFloor";
import SecondFloor from "./pages/SecondFloor"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route path="/first-floor" element={<FirstFloor />} />

        <Route
          path="/second-floor"
          element={<SecondFloor />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;