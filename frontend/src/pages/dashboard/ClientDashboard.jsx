import { useSelector } from "react-redux";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import StatCard from "../../components/dashboard/StatCard";
import RecentActivity from "../../components/dashboard/RecentActivity";
import QuickActions from "../../components/dashboard/QuickActions";
import NotificationPanel from "../../components/dashboard/NotificationPanel";
import {
    HiOutlineBriefcase,
    HiOutlineUserGroup,
    HiOutlineCurrencyDollar,
    HiOutlineChatBubbleLeftRight,
    HiOutlinePlusCircle,
    HiOutlineMagnifyingGlass
} from "react-icons/hi2";

export default function ClientDashboard() {
    const { user } = useSelector((state) => state.auth);

    const stats = [
        {
            label: "Active Projects",
            value: "2",
            icon: HiOutlineBriefcase,
            color: "text-blue-600 bg-blue-50",
            trend: 0
        },
        {
            label: "Hired Freelancers",
            value: "5",
            icon: HiOutlineUserGroup,
            color: "text-emerald-600 bg-emerald-50",
            trend: 20
        },
        {
            label: "Total Spent",
            value: "$8,400",
            icon: HiOutlineCurrencyDollar,
            color: "text-amber-600 bg-amber-50"
        },
        {
            label: "Messages",
            value: "12",
            icon: HiOutlineChatBubbleLeftRight,
            color: "text-purple-600 bg-purple-50",
            trend: 5
        }
    ];

    const quickActions = [
        {
            label: "Post a New Project",
            description: "Create a new project listing",
            to: "/dashboard/projects",
            icon: HiOutlinePlusCircle
        },
        {
            label: "Browse Freelancers",
            description: "Find talented professionals",
            to: "/dashboard/browse",
            icon: HiOutlineMagnifyingGlass
        },
        {
            label: "Messages",
            description: "Chat with your hired freelancers",
            to: "/dashboard/messages",
            icon: HiOutlineChatBubbleLeftRight
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <WelcomeBanner
                user={user}
                subtitle="Manage your projects and find the best freelancers for your needs."
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

                    {/* Active Projects */}
                    <div className="bg-white rounded-xl border border-surface-200 p-6">
                        <h3 className="text-lg font-semibold text-surface-900 mb-4">
                            Your Projects
                        </h3>
                        <div className="space-y-3">
                            {[
                                { name: "E-commerce Website Redesign", status: "In Progress", proposals: 8 },
                                { name: "Mobile App Development", status: "Review", proposals: 12 }
                            ].map((project, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-4 bg-surface-50 rounded-lg border border-surface-200 hover:shadow-sm transition"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-surface-800">
                                            {project.name}
                                        </p>
                                        <p className="text-xs text-surface-500 mt-0.5">
                                            {project.proposals} proposals received
                                        </p>
                                    </div>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                        project.status === "In Progress"
                                            ? "bg-blue-50 text-blue-600"
                                            : "bg-amber-50 text-amber-600"
                                    }`}>
                                        {project.status}
                                    </span>
                                </div>
                            ))}
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
