import { useSelector } from "react-redux";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import StatCard from "../../components/dashboard/StatCard";
import RecentActivity from "../../components/dashboard/RecentActivity";
import NotificationPanel from "../../components/dashboard/NotificationPanel";
import {
    HiOutlineUsers,
    HiOutlineBriefcase,
    HiOutlineCurrencyDollar,
    HiOutlineChartBarSquare,
    HiOutlineShieldCheck,
    HiOutlineExclamationTriangle
} from "react-icons/hi2";

export default function AdminDashboard() {
    const { user } = useSelector((state) => state.auth);

    const stats = [
        {
            label: "Total Users",
            value: "1,245",
            icon: HiOutlineUsers,
            color: "text-blue-600 bg-blue-50",
            trend: 15
        },
        {
            label: "Active Projects",
            value: "340",
            icon: HiOutlineBriefcase,
            color: "text-emerald-600 bg-emerald-50",
            trend: 8
        },
        {
            label: "Platform Revenue",
            value: "$52,300",
            icon: HiOutlineCurrencyDollar,
            color: "text-amber-600 bg-amber-50",
            trend: 22
        },
        {
            label: "Completion Rate",
            value: "94%",
            icon: HiOutlineChartBarSquare,
            color: "text-purple-600 bg-purple-50",
            trend: 3
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <WelcomeBanner
                user={user}
                subtitle="Here's your platform overview and admin controls."
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

                    {/* Recent Signups Table */}
                    <div className="bg-white rounded-xl border border-surface-200 p-6">
                        <h3 className="text-lg font-semibold text-surface-900 mb-4">
                            Recent Signups
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-surface-200">
                                        <th className="text-left py-3 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="text-left py-3 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="text-left py-3 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { name: "Alex Johnson", email: "alex@example.com", role: "Freelancer", verified: true },
                                        { name: "Sarah Miller", email: "sarah@example.com", role: "Client", verified: true },
                                        { name: "Mike Chen", email: "mike@example.com", role: "Freelancer", verified: false }
                                    ].map((u, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition"
                                        >
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-bold">
                                                        {u.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-surface-800">
                                                            {u.name}
                                                        </p>
                                                        <p className="text-xs text-surface-500">
                                                            {u.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-100 text-surface-600">
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                {u.verified ? (
                                                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                                                        <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs text-amber-600">
                                                        <HiOutlineExclamationTriangle className="h-3.5 w-3.5" />
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Platform Health */}
                    <div className="bg-white rounded-xl border border-surface-200 p-6">
                        <h3 className="text-lg font-semibold text-surface-900 mb-4">
                            Platform Health
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: "Server Uptime", value: "99.9%", color: "bg-emerald-500" },
                                { label: "API Response", value: "45ms", color: "bg-blue-500" },
                                { label: "Error Rate", value: "0.1%", color: "bg-emerald-500" }
                            ].map((metric) => (
                                <div key={metric.label}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-surface-600">{metric.label}</span>
                                        <span className="font-semibold text-surface-800">
                                            {metric.value}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${metric.color}`}
                                            style={{ width: "95%" }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <NotificationPanel />
                </div>
            </div>
        </div>
    );
}
