import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import DashboardStats from "../../components/dashboard/DashboardStats";
import QuickActions from "../../components/dashboard/QuickActions";
import {
    HiOutlineBriefcase,
    HiOutlineCheckCircle,
    HiOutlineDocumentText,
    HiOutlineFolderOpen,
    HiOutlineMagnifyingGlass,
    HiOutlinePlusCircle,
    HiOutlineQueueList,
    HiOutlineCalendarDays,
    HiOutlineClock,
    HiOutlineDocumentCheck,
    HiOutlineExclamationTriangle,
    HiOutlineStar
} from "react-icons/hi2";
import { useClientDashboard } from "../../hooks/useDashboardStats";
import MilestoneStatusBadge from "../../components/projects/MilestoneStatusBadge";

const getNeedsAttentionTimeIndicator = (item) => {
    if (item.status === "submitted") {
        if (!item.submittedAt) return "Submitted";
        const ms = Date.now() - new Date(item.submittedAt).getTime();
        const hours = Math.floor(ms / (60 * 60 * 1000));
        const days = Math.floor(hours / 24);
        if (days > 0) return `Submitted ${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `Submitted ${hours} hour${hours > 1 ? 's' : ''} ago`;
        return "Submitted just now";
    }
    if (item.status === "overdue" || item.isOverdue) {
        if (!item.dueDate) return "Overdue";
        const ms = Date.now() - new Date(item.dueDate).getTime();
        const hours = Math.floor(ms / (60 * 60 * 1000));
        const days = Math.floor(hours / 24);
        if (days > 0) return `Overdue by ${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `Overdue by ${hours} hour${hours > 1 ? 's' : ''}`;
        return "Overdue";
    }
    if (item.dueDate) {
        const ms = new Date(item.dueDate).getTime() - Date.now();
        if (ms <= 0) return "Due soon";
        const hours = Math.floor(ms / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        if (hours > 0) return `Due in ${hours}h ${minutes}m`;
        return `Due in ${minutes}m`;
    }
    return "";
};

function NeedsAttentionSection({ items, isLoading }) {
    if (isLoading) return null;
    if (!items || items.length === 0) {
        return (
            <section className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Needs Attention
                </h2>
                <p className="text-sm text-surface-500 mt-3 font-medium">All caught up! No active tasks need immediate review.</p>
            </section>
        );
    }

    return (
        <section className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                Needs Attention
            </h2>
            <div className="divide-y divide-surface-100 max-h-[400px] overflow-y-auto pr-2">
                {items.map((item, index) => {
                    const timeIndicator = getNeedsAttentionTimeIndicator(item);
                    const isSubmitted = item.status === "submitted";

                    return (
                        <div key={item.milestoneId || index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                            <div className="min-w-0">
                                <h4 className="text-sm font-extrabold text-surface-950 truncate">
                                    {item.milestoneTitle}
                                </h4>
                                <p className="text-xs text-surface-400 font-semibold mt-1">
                                    Project: <span className="text-surface-700">{item.projectTitle}</span>
                                </p>
                                <div className="flex items-center gap-2.5 mt-2">
                                    <MilestoneStatusBadge status={item.status} />
                                    {timeIndicator && (
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                                            isSubmitted ? "bg-violet-50 text-violet-750 border-violet-100" :
                                            (item.status === "overdue" || item.isOverdue) ? "bg-red-50 text-red-750 border-red-100" :
                                            "bg-amber-50 text-amber-700 border-amber-100"
                                        }`}>
                                            {timeIndicator}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex-shrink-0 self-end sm:self-center">
                                <Link
                                    to={`/dashboard/my-projects/${item.projectId}`}
                                    className={`inline-flex items-center justify-center px-4 py-2 font-bold text-xs rounded-xl shadow-sm transition border ${
                                        isSubmitted
                                            ? "bg-primary-600 hover:bg-primary-700 text-white border-transparent"
                                            : "bg-surface-50 hover:bg-surface-100 text-surface-700 border-surface-200"
                                    }`}
                                >
                                    {isSubmitted ? "Review" : "Open Project"}
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default function ClientDashboard() {
    const { user } = useSelector((state) => state.auth);
    const { stats, isLoading, error } = useClientDashboard();

    const cards = [
        {
            label: "Total Gigs Posted",
            value: stats?.totalGigsPosted || 0,
            icon: HiOutlineBriefcase,
            color: "text-blue-600 bg-blue-50"
        },
        {
            label: "Open Gigs",
            value: stats?.openGigs || 0,
            icon: HiOutlineFolderOpen,
            color: "text-emerald-600 bg-emerald-50"
        },
        {
            label: "Closed Gigs",
            value: stats?.closedGigs || 0,
            icon: HiOutlineCheckCircle,
            color: "text-surface-600 bg-surface-100"
        },
        {
            label: "Proposals Received",
            value: stats?.totalProposalsReceived || 0,
            icon: HiOutlineDocumentText,
            color: "text-violet-600 bg-violet-50"
        },
        {
            label: "Pending Proposals",
            value: stats?.pendingProposals || 0,
            icon: HiOutlineQueueList,
            color: "text-amber-600 bg-amber-50"
        },
        {
            label: "Accepted Proposals",
            value: stats?.acceptedProposals || 0,
            icon: HiOutlineCheckCircle,
            color: "text-teal-600 bg-teal-50"
        },
        {
            label: "Active Projects",
            value: stats?.activeProjects || 0,
            icon: HiOutlineBriefcase,
            color: "text-cyan-600 bg-cyan-50",
            to: "/dashboard/my-projects"
        },
        {
            label: "Milestones Due Today",
            value: stats?.milestonesDueToday || 0,
            icon: HiOutlineCalendarDays,
            color: "text-amber-650 bg-amber-50"
        },
        {
            label: "Overdue Milestones",
            value: stats?.overdueMilestones || 0,
            icon: HiOutlineClock,
            color: "text-red-650 bg-red-50",
            to: "/dashboard/my-projects?filter=at-risk"
        },
        {
            label: "Pending Approvals",
            value: stats?.pendingApprovals || 0,
            icon: HiOutlineDocumentCheck,
            color: "text-violet-650 bg-violet-50"
        },
        {
            label: "At-Risk Projects",
            value: stats?.atRiskProjects || 0,
            icon: HiOutlineExclamationTriangle,
            color: "text-red-700 bg-red-100",
            to: "/dashboard/my-projects?filter=at-risk"
        },
        {
            label: "Your Rating",
            value: stats?.averageRating ? stats.averageRating.toFixed(1) : "N/A",
            icon: HiOutlineStar,
            color: "text-amber-600 bg-amber-50"
        },
        {
            label: "Reviews Received",
            value: stats?.totalReviews || 0,
            icon: HiOutlineCheckCircle,
            color: "text-amber-600 bg-amber-50"
        },
        {
            label: "Pending Reviews",
            value: stats?.pendingReviews || 0,
            icon: HiOutlineDocumentText,
            color: "text-orange-600 bg-orange-50",
            to: "/dashboard/my-projects?filter=completed"
        }
    ];

    const quickActions = [
        {
            label: "Post a New Gig",
            description: "Publish work freelancers can bid on",
            to: "/dashboard/gigs/create",
            icon: HiOutlinePlusCircle
        },
        {
            label: "Manage My Gigs",
            description: "Review bids and close finished work",
            to: "/dashboard/gigs/my",
            icon: HiOutlineBriefcase
        },
        {
            label: "Browse Marketplace",
            description: "See the current gig marketplace",
            to: "/dashboard/projects",
            icon: HiOutlineMagnifyingGlass
        },
        {
            label: "View My Projects",
            description: "Track active projects and milestones",
            to: "/dashboard/my-projects",
            icon: HiOutlineFolderOpen
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <WelcomeBanner
                user={user}
                subtitle="Manage posted gigs and incoming freelancer proposals."
            />

            <DashboardStats stats={cards} isLoading={isLoading} error={error} />

            <NeedsAttentionSection items={stats?.needsAttention} isLoading={isLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
                <LiveStatsNote />
                <QuickActions actions={quickActions} />
            </div>
        </div>
    );
}

function LiveStatsNote() {
    return (
        <section className="bg-white rounded-xl border border-surface-200 p-6">
            <h2 className="text-lg font-semibold text-surface-900">
                Marketplace Activity
            </h2>
            <p className="text-sm text-surface-600 leading-relaxed mt-3">
                Counts refresh from MongoDB on page load, after navigation, and every 15 seconds.
                Gig creates, deletes, status changes, and proposal decisions are reflected in these
                totals without realtime infrastructure.
            </p>
        </section>
    );
}
