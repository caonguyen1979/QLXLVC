import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Evaluation } from "./pages/Evaluation";
import { Admin } from "./pages/Admin";
import { Unauthorized } from "./pages/Unauthorized";
import { TeamEvaluation } from "./pages/TeamEvaluation";
import { useAuthStore } from "./store/authStore";

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<Layout />}>
          {/* Public Route inside Layout */}
          <Route path="/" element={<Dashboard />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["Teacher", "Staff", "TeamLeader", "Principal"]}
              />
            }
          >
            <Route path="/evaluation" element={<Evaluation />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* Placeholder for Team route */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["TeamLeader", "Principal"]} />
            }
          >
            <Route path="/team" element={<TeamEvaluation />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
