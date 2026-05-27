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
    HiOutlineQueueList
} from "react-icons/hi2";
import { useClientDashboard } from "../../hooks/useDashboardStats";

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
            color: "text-cyan-600 bg-cyan-50"
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
