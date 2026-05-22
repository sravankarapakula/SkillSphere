import { useSelector } from "react-redux";
import FreelancerDashboard from "./FreelancerDashboard";
import ClientDashboard from "./ClientDashboard";
import AdminDashboard from "./AdminDashboard";

export default function DashboardPage() {
    const { user } = useSelector((state) => state.auth);

    if (user?.role === "freelancer") {
        return <FreelancerDashboard />;
    }

    if (user?.role === "admin") {
        return <AdminDashboard />;
    }

    return <ClientDashboard />;
}
