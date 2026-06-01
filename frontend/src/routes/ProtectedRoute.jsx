import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { FullPageSpinner } from "../components/shared/LoadingSpinner";
import { getAccessToken } from "../utils/authStorage";

function Forbidden() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-3xl font-bold text-surface-900">403 Forbidden</h1>
            <p className="text-sm text-surface-500 mt-2">
                You do not have permission to access this page.
            </p>
        </div>
    );
}

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
        return <Forbidden />;
    }

    return children || <Outlet />;
}
