import { Navigate } from "react-router-dom";
import { useAuth } from "../store/auth.store";
import Home from "../pages/Home";

export default function RootPage() {
    const { user } = useAuth();

    if (user?.role === "STAFF") {
        return <Navigate to="/staff/orders" replace />;
    }

    return <Home />;
}