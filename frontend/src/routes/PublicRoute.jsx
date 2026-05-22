import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { FullPageSpinner } from "../components/shared/LoadingSpinner";
import { getAccessToken } from "../utils/authStorage";

export default function PublicRoute() {
    const { user, token, isLoading } = useSelector((state) => state.auth);
    const accessToken = token || getAccessToken();

    if (isLoading) {
        return <FullPageSpinner />;
    }

    // Already authenticated — redirect to dashboard
    if (accessToken && user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
