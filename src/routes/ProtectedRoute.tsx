import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../store/auth.store";

export default function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "USER") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
