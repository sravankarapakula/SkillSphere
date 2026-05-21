import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { FullPageSpinner } from "../components/shared/LoadingSpinner";

export default function PublicRoute() {
    const { user, token, isLoading } = useSelector((state) => state.auth);

    if (isLoading) {
        return <FullPageSpinner />;
    }

    // Already authenticated — redirect to dashboard
    if (token && user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
