import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth.store";

export default function StaffRoute() {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated || !user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    if (user.role !== "STAFF") {
        if (user.role === "ADMIN") {
            return <Navigate to="/admin" replace />;
        }

        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}