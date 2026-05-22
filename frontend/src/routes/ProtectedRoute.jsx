import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { FullPageSpinner } from "../components/shared/LoadingSpinner";
import { getAccessToken } from "../utils/authStorage";

export default function ProtectedRoute({ allowedRoles, children }) {
    const { user, token, isLoading } = useSelector((state) => state.auth);
    const accessToken = token || getAccessToken();

    if (isLoading) {
        return <FullPageSpinner />;
    }

    // Not authenticated — redirect to login
    if (!accessToken || !user) {
        return <Navigate to="/login" replace />;
    }

    // Role check — if allowedRoles is specified, verify the user's role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children || <Outlet />;
}
