import React from "react";
import { Navigate } from "react-router-dom";
import { getRole, isAuthenticated } from "../utils/auth";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const role = getRole();

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}