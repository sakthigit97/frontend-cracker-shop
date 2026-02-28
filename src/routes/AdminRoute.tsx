import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../store/auth.store";

export default function AdminGuard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}