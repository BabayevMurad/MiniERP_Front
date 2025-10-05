import { useContext, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ roles }) {
  const { user, token } = useContext(AuthContext);
  const location = useLocation();

  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const effectiveToken =
    token || (typeof window !== "undefined" ? localStorage.getItem("token") : "");

  if (!ready) return null;

  if (!effectiveToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.length && user?.role && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
