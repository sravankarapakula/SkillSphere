import { useSelector } from "react-redux";
import {
    HiOutlineBriefcase,
    HiOutlineCurrencyDollar,
    HiOutlineDocumentText,
    HiOutlineChartBar
} from "react-icons/hi2";

export default function DashboardPage() {
    const { user } = useSelector((state) => state.auth);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl gradient-bg p-8 text-white">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 blur-2xl" />

                <div className="relative z-10">
                    <p className="text-white/70 text-sm font-medium mb-1">
                        {getGreeting()},
                    </p>
                    <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                        {user?.name} 👋
                    </h1>
                    <p className="text-white/60 text-sm max-w-md">
                        {user?.role === "freelancer"
                            ? "Here's an overview of your freelancing activity and stats."
                            : user?.role === "admin"
                            ? "Here's your platform overview and admin controls."
                            : "Manage your projects and find talented freelancers."}
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Active Projects",
                        value: "0",
                        icon: HiOutlineBriefcase,
                        color: "text-blue-600 bg-blue-50"
                    },
                    {
                        label: "Earnings",
                        value: "$0",
                        icon: HiOutlineCurrencyDollar,
                        color: "text-emerald-600 bg-emerald-50"
                    },
                    {
                        label: "Proposals",
                        value: "0",
                        icon: HiOutlineDocumentText,
                        color: "text-amber-600 bg-amber-50"
                    },
                    {
                        label: "Completion Rate",
                        value: "0%",
                        icon: HiOutlineChartBar,
                        color: "text-purple-600 bg-purple-50"
                    }
                ].map((stat, i) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-xl border border-surface-200 p-5 hover:shadow-md transition-shadow duration-300"
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div
                                className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}
                            >
                                <stat.icon className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-surface-900">
                            {stat.value}
                        </p>
                        <p className="text-sm text-surface-500 mt-1">
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-surface-200 p-6">
                    <h3 className="text-lg font-semibold text-surface-900 mb-4">
                        Recent Activity
                    </h3>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-16 w-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
                            <HiOutlineDocumentText className="h-8 w-8 text-surface-400" />
                        </div>
                        <p className="text-surface-500 text-sm">
                            No recent activity yet
                        </p>
                        <p className="text-surface-400 text-xs mt-1">
                            Your latest actions will appear here
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-surface-200 p-6">
                    <h3 className="text-lg font-semibold text-surface-900 mb-4">
                        Quick Actions
                    </h3>
                    <div className="space-y-3">
                        {user?.role === "freelancer" && (
                            <>
                                <QuickAction
                                    label="Complete Your Profile"
                                    description="Add skills and experience"
                                    to="/dashboard/profile"
                                />
                                <QuickAction
                                    label="Browse Projects"
                                    description="Find new opportunities"
                                    to="/dashboard/projects"
                                />
                            </>
                        )}
                        {user?.role === "client" && (
                            <>
                                <QuickAction
                                    label="Post a Project"
                                    description="Describe what you need"
                                    to="/dashboard/projects"
                                />
                                <QuickAction
                                    label="Browse Freelancers"
                                    description="Find the right talent"
                                    to="/dashboard/browse"
                                />
                            </>
                        )}
                        {user?.role === "admin" && (
                            <>
                                <QuickAction
                                    label="Manage Users"
                                    description="View and manage accounts"
                                    to="/dashboard/users"
                                />
                                <QuickAction
                                    label="Platform Analytics"
                                    description="View platform statistics"
                                    to="/dashboard/analytics"
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuickAction({ label, description, to }) {
    return (
        <a
            href={to}
            className="block p-3 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200 group"
        >
            <p className="text-sm font-semibold text-surface-800 group-hover:text-primary-700">
                {label}
            </p>
            <p className="text-xs text-surface-500 mt-0.5">{description}</p>
        </a>
    );
}
