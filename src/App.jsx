import React from "react";
import { Routes, Route } from "react-router-dom";
import Admin from "./Admin";
import Auth from "./Auth";
import TVQueueDisplay from "./displays/TVQueueDisplay";
import InputEmployeeData from "./InputEmployeeDataForm";

const App = () => {
  return (
    <Routes>
      {/* Login Page */}
      <Route path="/" element={<Auth />} />

      {/* Admin Interface */}
      <Route path="/admin" element={<Admin />} />
      <Route path="/tv-queue-display" element={<TVQueueDisplay />} />
      <Route path="/input-employee-data" element={<InputEmployeeData />} />

      {/* Fallback */}
      <Route path="*" element={<Auth />} />
    </Routes>
  );
};

export default App;
