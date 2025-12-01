import React from "react";
import { Route, Routes } from "react-router-dom";
import Login from "../pages/auth/login";
import WasteDashboard from "../pages/admin/dashboard";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<WasteDashboard />} />
    </Routes>
  );
};

export default AppRoutes;
