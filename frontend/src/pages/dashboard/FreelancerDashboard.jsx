import { useSelector } from "react-redux";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import StatCard from "../../components/dashboard/StatCard";
import RecentActivity from "../../components/dashboard/RecentActivity";
import QuickActions from "../../components/dashboard/QuickActions";
import NotificationPanel from "../../components/dashboard/NotificationPanel";
import {
    HiOutlineBriefcase,
    HiOutlineCurrencyDollar,
    HiOutlineDocumentText,
    HiOutlineChartBar,
    HiOutlineUser,
    HiOutlineMagnifyingGlass
} from "react-icons/hi2";

export default function FreelancerDashboard() {
    const { user } = useSelector((state) => state.auth);

    const stats = [
        {
            label: "Active Projects",
            value: "3",
            icon: HiOutlineBriefcase,
            color: "text-blue-600 bg-blue-50",
            trend: 12
        },
        {
            label: "Total Earnings",
            value: "$4,250",
            icon: HiOutlineCurrencyDollar,
            color: "text-emerald-600 bg-emerald-50",
            trend: 8
        },
        {
            label: "Pending Proposals",
            value: "5",
            icon: HiOutlineDocumentText,
            color: "text-amber-600 bg-amber-50",
            trend: -3
        },
        {
            label: "Profile Views",
            value: "128",
            icon: HiOutlineChartBar,
            color: "text-purple-600 bg-purple-50",
            trend: 24
        }
    ];

    const quickActions = [
        {
            label: "Complete Your Profile",
            description: "Add skills, experience, and portfolio",
            to: "/dashboard/profile",
            icon: HiOutlineUser
        },
        {
            label: "Browse Projects",
            description: "Find new freelancing opportunities",
            to: "/dashboard/projects",
            icon: HiOutlineMagnifyingGlass
        },
        {
            label: "View Proposals",
            description: "Check status of your proposals",
            to: "/dashboard/proposals",
            icon: HiOutlineDocumentText
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <WelcomeBanner
                user={user}
                subtitle="Here's an overview of your freelancing activity and performance."
            />

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={stat.label} style={{ animationDelay: `${i * 80}ms` }} className="animate-fade-in">
                        <StatCard {...stat} />
                    </div>
                ))}
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <RecentActivity />

                    {/* Earnings Chart Placeholder */}
                    <div className="bg-white rounded-xl border border-surface-200 p-6">
                        <h3 className="text-lg font-semibold text-surface-900 mb-4">
                            Earnings Overview
                        </h3>
                        <div className="h-48 flex items-center justify-center bg-surface-50 rounded-lg">
                            <div className="text-center">
                                <p className="text-sm text-surface-400">
                                    📊 Chart coming soon
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <QuickActions actions={quickActions} />
                    <NotificationPanel />
                </div>
            </div>
        </div>
    );
}
