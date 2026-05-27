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
    HiOutlineQueueList,
    HiOutlineUser,
    HiOutlineXCircle
} from "react-icons/hi2";
import { useFreelancerDashboard } from "../../hooks/useDashboardStats";

export default function FreelancerDashboard() {
    const { user } = useSelector((state) => state.auth);
    const { stats, isLoading, error } = useFreelancerDashboard();

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
            color: "text-cyan-600 bg-cyan-50"
        },
        {
            label: "Completed Projects",
            value: stats?.completedProjects || 0,
            icon: HiOutlineCheckCircle,
            color: "text-teal-600 bg-teal-50"
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
                <section className="bg-white rounded-xl border border-surface-200 p-6">
                    <h2 className="text-lg font-semibold text-surface-900">
                        Proposal Sync
                    </h2>
                    <p className="text-sm text-surface-600 leading-relaxed mt-3">
                        Proposal totals refresh when you return to the dashboard and on a
                        15-second polling interval. Accepted work stays active while the gig is
                        open and moves to completed when that gig is closed.
                    </p>
                </section>
                <QuickActions actions={quickActions} />
            </div>
        </div>
    );
}
