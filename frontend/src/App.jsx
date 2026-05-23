import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadUser } from "./redux/slices/authSlice";
import { FullPageSpinner } from "./components/shared/LoadingSpinner";
import { getAccessToken } from "./utils/authStorage";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Route guards
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Dashboard Pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import FreelancerDashboard from "./pages/dashboard/FreelancerDashboard";
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";

// Profile Pages
import ProfilePage from "./pages/profile/ProfilePage";
import EditProfilePage from "./pages/profile/EditProfilePage";
import GigListPage from "./pages/gigs/GigListPage";
import GigDetailPage from "./pages/gigs/GigDetailPage";
import CreateGigPage from "./pages/gigs/CreateGigPage";
import MyGigsPage from "./pages/gigs/MyGigsPage";
import MyProposalsPage from "./pages/proposals/MyProposalsPage";
import GigProposalsPage from "./pages/proposals/GigProposalsPage";
import MessagesPage from "./pages/Messages";
import SocketProvider from "./components/shared/SocketProvider";

export default function App() {
    const dispatch = useDispatch();
    const { token, isLoading, user } = useSelector((state) => state.auth);
    const accessToken = token || getAccessToken();

    // On mount, if a token exists, verify it by loading the user
    useEffect(() => {
        if (accessToken && !user) {
            dispatch(loadUser());
        }
    }, [dispatch, accessToken, user]);

    // Show spinner while initially verifying the token
    if (accessToken && !user && isLoading) {
        return <FullPageSpinner />;
    }

    return (
        <SocketProvider>
            <Routes>
            {/* Public routes (login, register) — redirect if authenticated */}
            <Route element={<PublicRoute />}>
                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Route>
            </Route>

            {/* Protected routes — redirect to login if not authenticated */}
            <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* Profile routes (freelancer) */}
                    <Route
                        element={<ProtectedRoute allowedRoles={["freelancer"]} />}
                    >
                        <Route path="/dashboard/profile" element={<ProfilePage />} />
                        <Route path="/dashboard/profile/edit" element={<EditProfilePage />} />
                    </Route>

                    {/* Role-specific dashboard views */}
                    <Route
                        path="/dashboard/freelancer"
                        element={
                            <ProtectedRoute allowedRoles={["freelancer"]}>
                                <FreelancerDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashboard/client"
                        element={
                            <ProtectedRoute allowedRoles={["client"]}>
                                <ClientDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        element={<ProtectedRoute allowedRoles={["admin"]} />}
                    >
                        <Route path="/dashboard/admin" element={<AdminDashboard />} />
                    </Route>

                    {/* Gig marketplace */}
                    <Route path="/dashboard/projects" element={<GigListPage />} />
                    <Route path="/dashboard/gigs" element={<GigListPage />} />
                    <Route path="/dashboard/gigs/:gigId" element={<GigDetailPage />} />
                    <Route
                        element={<ProtectedRoute allowedRoles={["client"]} />}
                    >
                        <Route path="/dashboard/gigs/create" element={<CreateGigPage />} />
                        <Route path="/dashboard/gigs/my" element={<MyGigsPage />} />
                        <Route path="/dashboard/gigs/:gigId/proposals" element={<GigProposalsPage />} />
                    </Route>

                    {/* Proposal tracking */}
                    <Route
                        element={<ProtectedRoute allowedRoles={["freelancer"]} />}
                    >
                        <Route path="/dashboard/proposals" element={<MyProposalsPage />} />
                    </Route>

                    {/* Placeholder routes for later stages */}
                    <Route path="/dashboard/messages" element={<MessagesPage />} />
                    <Route path="/dashboard/browse" element={<ComingSoon title="Browse Talent" />} />
                    <Route path="/dashboard/users" element={<ComingSoon title="User Management" />} />
                    <Route path="/dashboard/analytics" element={<ComingSoon title="Analytics" />} />
                    <Route path="/dashboard/settings" element={<ComingSoon title="Settings" />} />
                </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </SocketProvider>
    );
}

// Placeholder page for unbuilt routes
function ComingSoon({ title }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
                <span className="text-3xl">🚧</span>
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">{title}</h2>
            <p className="text-sm text-surface-500">
                This section is under development.
            </p>
        </div>
    );
}
