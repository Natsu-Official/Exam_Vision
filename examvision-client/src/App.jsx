import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

import StudentDashboard from "./pages/StudentDashboard.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

import ExamListPage from "./pages/ExamListPage.jsx";
import ExamTakingPage from "./pages/ExamTakingPage.jsx";
import TeacherReportsPage from "./pages/TeacherReportsPage.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/settings" element={<SettingsPage />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/exams"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ExamListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/exam/:examId"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <ExamTakingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/reports"
        element={
          <ProtectedRoute allowedRoles={["teacher", "admin"]}>
            <TeacherReportsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <div className="container">
            <div className="card">404 - Page not found</div>
          </div>
        }
      />
    </Routes>
  );
}