import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import DashboardStats from "../../components/dashboard/DashboardStats";
import QuickActions from "../../components/dashboard/QuickActions";
import {
    HiOutlineBriefcase,
    HiOutlineCheckCircle,
    HiOutlineDocumentText,
    HiOutlineFolderOpen,
    HiOutlineMagnifyingGlass,
    HiOutlineQueueList,
    HiOutlineUser,
    HiOutlineXCircle,
    HiOutlineCalendarDays,
    HiOutlineClock,
    HiOutlineDocumentCheck
} from "react-icons/hi2";
import { useFreelancerDashboard } from "../../hooks/useDashboardStats";
import { getUpcomingTasks } from "../../api/taskApi";
import MilestoneStatusBadge from "../../components/projects/MilestoneStatusBadge";

const formatTimeRemaining = (timeRemaining, isOverdue, dueDate) => {
    if (isOverdue) {
        if (!dueDate) return "Overdue";
        const ms = Date.now() - new Date(dueDate).getTime();
        if (ms <= 0) return "Overdue";
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        if (days > 0) return `Overdue by ${days}d ${remainingHours}h`;
        return `Overdue by ${hours}h`;
    }
    
    if (!timeRemaining || timeRemaining <= 0) return "Due soon";
    
    const seconds = Math.floor(timeRemaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) return `Due in ${days}d ${remainingHours}h`;
    return `Due in ${hours}h`;
};

function UpcomingTasksWidget({ tasks, isLoading }) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm animate-pulse">
                <div className="h-6 w-36 bg-surface-150 rounded mb-4" />
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-12 bg-surface-50 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary-500 animate-pulse" />
                    Upcoming Tasks
                </h2>
                <Link
                    to="/dashboard/tasks"
                    className="text-xs font-bold text-primary-650 hover:text-primary-800 transition"
                >
                    View All Tasks
                </Link>
            </div>

            {tasks.length === 0 ? (
                <p className="text-sm text-surface-500 font-medium py-2">
                    No upcoming tasks. You're all caught up!
                </p>
            ) : (
                <div className="divide-y divide-surface-100 pr-2">
                    {tasks.map((task) => {
                        const timeIndicator = formatTimeRemaining(task.timeRemaining, task.isOverdue, task.dueDate);
                        return (
                            <div key={task.milestoneId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                                <div className="min-w-0">
                                    <h4 className="text-sm font-extrabold text-surface-950 truncate">
                                        {task.milestoneTitle}
                                    </h4>
                                    <p className="text-xs text-surface-400 font-semibold mt-1">
                                        Project: <span className="text-surface-700">{task.projectTitle}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <MilestoneStatusBadge status={task.status} />
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                            task.isOverdue ? "bg-red-50 text-red-750 border-red-100 animate-pulse" : "bg-primary-50 text-primary-750 border-primary-100"
                                        }`}>
                                            {timeIndicator}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 self-end sm:self-center">
                                    <Link
                                        to={`/dashboard/my-projects/${task.projectId}`}
                                        className="inline-flex items-center justify-center px-3.5 py-1.5 font-bold text-xs rounded-xl bg-surface-50 hover:bg-surface-100 text-surface-700 border border-surface-200 hover:border-surface-300 transition"
                                    >
                                        Open Project
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default function FreelancerDashboard() {
    const { user } = useSelector((state) => state.auth);
    const { stats, isLoading, error } = useFreelancerDashboard();
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const data = await getUpcomingTasks({ limit: 5 });
                if (data.success) {
                    setUpcomingTasks(data.data.tasks || []);
                }
            } catch (err) {
                console.error("Failed to load dashboard tasks", err);
            } finally {
                setLoadingTasks(false);
            }
        };
        if (stats) {
            fetchTasks();
        }
    }, [stats]);

    const cards = [
        {
            label: "Gigs Applied",
            value: stats?.gigsApplied || 0,
            icon: HiOutlineDocumentText,
            color: "text-blue-600 bg-blue-50"
        },
        {
            label: "Proposals Sent",
            value: stats?.totalProposalsSent || 0,
            icon: HiOutlineQueueList,
            color: "text-violet-600 bg-violet-50"
        },
        {
            label: "Pending Proposals",
            value: stats?.pendingProposals || 0,
            icon: HiOutlineDocumentText,
            color: "text-amber-600 bg-amber-50"
        },
        {
            label: "Accepted Proposals",
            value: stats?.acceptedProposals || 0,
            icon: HiOutlineCheckCircle,
            color: "text-emerald-600 bg-emerald-50"
        },
        {
            label: "Rejected Proposals",
            value: stats?.rejectedProposals || 0,
            icon: HiOutlineXCircle,
            color: "text-red-600 bg-red-50"
        },
        {
            label: "Active Projects",
            value: stats?.activeProjects || 0,
            icon: HiOutlineBriefcase,
            color: "text-cyan-600 bg-cyan-50",
            to: "/dashboard/my-projects"
        },
        {
            label: "Completed Projects",
            value: stats?.completedProjects || 0,
            icon: HiOutlineCheckCircle,
            color: "text-teal-600 bg-teal-50"
        },
        {
            label: "Tasks This Week",
            value: stats?.tasksThisWeek || 0,
            icon: HiOutlineCalendarDays,
            color: "text-amber-650 bg-amber-50",
            to: "/dashboard/tasks?filter=this-week"
        },
        {
            label: "Overdue Tasks",
            value: stats?.overdueTasks || 0,
            icon: HiOutlineClock,
            color: "text-red-650 bg-red-50",
            to: "/dashboard/tasks?filter=overdue"
        },
        {
            label: "Awaiting Approval",
            value: stats?.awaitingApproval || 0,
            icon: HiOutlineDocumentCheck,
            color: "text-violet-650 bg-violet-50"
        }
    ];

    const quickActions = [
        {
            label: "Browse Gigs",
            description: "Find open work by skill and budget",
            to: "/dashboard/projects",
            icon: HiOutlineMagnifyingGlass
        },
        {
            label: "View My Proposals",
            description: "Track pending and decided bids",
            to: "/dashboard/proposals",
            icon: HiOutlineDocumentText
        },
        {
            label: "View My Projects",
            description: "Track active contracts and milestones",
            to: "/dashboard/my-projects",
            icon: HiOutlineFolderOpen
        },
        {
            label: "Complete Profile",
            description: "Keep your freelancer profile ready",
            to: "/dashboard/profile",
            icon: HiOutlineUser
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <WelcomeBanner
                user={user}
                subtitle="Track applications, decisions, and accepted marketplace work."
            />

            <DashboardStats stats={cards} isLoading={isLoading} error={error} />

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
                <UpcomingTasksWidget tasks={upcomingTasks} isLoading={loadingTasks} />
                <QuickActions actions={quickActions} />
            </div>
        </div>
    );
}
