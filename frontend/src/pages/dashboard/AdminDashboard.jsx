import { useSelector } from "react-redux";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import DashboardStats from "../../components/dashboard/DashboardStats";
import {
    HiOutlineBriefcase,
    HiOutlineDocumentText,
    HiOutlineFolderOpen,
    HiOutlineUserGroup,
    HiOutlineUsers,
    HiOutlineCreditCard
} from "react-icons/hi2";
import { useAdminDashboard } from "../../hooks/useDashboardStats";

export default function AdminDashboard() {
    const { user } = useSelector((state) => state.auth);
    const { stats, isLoading, error } = useAdminDashboard();

    const cards = [
        {
            label: "Total Transactions",
            value: stats?.totalTransactions || 0,
            icon: HiOutlineCreditCard,
            color: "text-blue-600 bg-blue-50",
            to: "/dashboard/payments"
        },
        {
            label: "Successful Payments",
            value: stats?.successfulPayments || 0,
            icon: HiOutlineCreditCard,
            color: "text-emerald-600 bg-emerald-50",
            to: "/dashboard/payments"
        },
        {
            label: "Failed Payments",
            value: stats?.failedPayments || 0,
            icon: HiOutlineCreditCard,
            color: "text-red-650 bg-red-50",
            to: "/dashboard/payments"
        },
        {
            label: "Platform Revenue",
            value: stats?.revenue ? `₹${stats.revenue.toLocaleString()}` : "₹0",
            icon: HiOutlineCreditCard,
            color: "text-violet-650 bg-violet-50",
            to: "/dashboard/payments"
        },
        {
            label: "Total Users",
            value: stats?.totalUsers || 0,
            icon: HiOutlineUsers,
            color: "text-blue-600 bg-blue-50"
        },
        {
            label: "Freelancers",
            value: stats?.totalFreelancers || 0,
            icon: HiOutlineUserGroup,
            color: "text-violet-600 bg-violet-50"
        },
        {
            label: "Clients",
            value: stats?.totalClients || 0,
            icon: HiOutlineUserGroup,
            color: "text-teal-600 bg-teal-50"
        },
        {
            label: "Total Gigs",
            value: stats?.totalGigs || 0,
            icon: HiOutlineBriefcase,
            color: "text-emerald-600 bg-emerald-50"
        },
        {
            label: "Total Proposals",
            value: stats?.totalProposals || 0,
            icon: HiOutlineDocumentText,
            color: "text-amber-600 bg-amber-50"
        },
        {
            label: "Open Projects",
            value: stats?.openProjects || 0,
            icon: HiOutlineFolderOpen,
            color: "text-cyan-600 bg-cyan-50"
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <WelcomeBanner
                user={user}
                subtitle="Monitor current users, gigs, and proposal volume."
            />

            <DashboardStats stats={cards} isLoading={isLoading} error={error} />

            <section className="bg-white rounded-xl border border-surface-200 p-6">
                <h2 className="text-lg font-semibold text-surface-900">Live Admin Snapshot</h2>
                <p className="text-sm text-surface-600 leading-relaxed mt-3">
                    Admin totals are read directly from the current User, Gig, and Proposal
                    collections and refresh every 15 seconds while this dashboard is open.
                </p>
            </section>
        </div>
    );
}
