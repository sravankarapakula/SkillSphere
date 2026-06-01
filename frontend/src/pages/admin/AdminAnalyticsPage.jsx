import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HiOutlineBriefcase, HiOutlineDocumentCheck, HiOutlineFolderOpen, HiOutlineStar, HiOutlineUsers } from "react-icons/hi2";
import DashboardStats from "../../components/dashboard/DashboardStats";
import { fetchAdminAnalytics } from "../../redux/slices/adminSlice";
import { AdminPageHeader } from "./AdminShared";

export default function AdminAnalyticsPage() {
    const dispatch = useDispatch();
    const { analytics, isLoading, error } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(fetchAdminAnalytics());
    }, [dispatch]);

    const cards = [
        { section: "User Metrics", label: "Total Users", value: analytics?.users?.totalUsers || 0, icon: HiOutlineUsers, color: "text-blue-600 bg-blue-50" },
        { section: "User Metrics", label: "Total Clients", value: analytics?.users?.totalClients || 0, icon: HiOutlineUsers, color: "text-teal-600 bg-teal-50" },
        { section: "User Metrics", label: "Total Freelancers", value: analytics?.users?.totalFreelancers || 0, icon: HiOutlineUsers, color: "text-violet-600 bg-violet-50" },
        { section: "User Metrics", label: "Suspended Users", value: analytics?.users?.suspendedUsers || 0, icon: HiOutlineUsers, color: "text-red-600 bg-red-50" },
        { section: "Marketplace Metrics", label: "Total Gigs", value: analytics?.marketplace?.totalGigs || 0, icon: HiOutlineBriefcase, color: "text-emerald-600 bg-emerald-50" },
        { section: "Marketplace Metrics", label: "Active Gigs", value: analytics?.marketplace?.activeGigs || 0, icon: HiOutlineBriefcase, color: "text-green-600 bg-green-50" },
        { section: "Marketplace Metrics", label: "Disabled Gigs", value: analytics?.marketplace?.disabledGigs || 0, icon: HiOutlineBriefcase, color: "text-red-600 bg-red-50" },
        { section: "Marketplace Metrics", label: "Total Proposals", value: analytics?.marketplace?.totalProposals || 0, icon: HiOutlineBriefcase, color: "text-amber-600 bg-amber-50" },
        { section: "Project Metrics", label: "Open Projects", value: analytics?.projects?.openProjects || 0, icon: HiOutlineFolderOpen, color: "text-cyan-600 bg-cyan-50" },
        { section: "Project Metrics", label: "In Progress Projects", value: analytics?.projects?.inProgressProjects || 0, icon: HiOutlineFolderOpen, color: "text-primary-600 bg-primary-50" },
        { section: "Project Metrics", label: "Completed Projects", value: analytics?.projects?.completedProjects || 0, icon: HiOutlineFolderOpen, color: "text-emerald-600 bg-emerald-50" },
        { section: "Review Metrics", label: "Total Reviews", value: analytics?.reviews?.totalReviews || 0, icon: HiOutlineStar, color: "text-amber-600 bg-amber-50" },
        { section: "Review Metrics", label: "Visible Reviews", value: analytics?.reviews?.visibleReviews || 0, icon: HiOutlineStar, color: "text-emerald-600 bg-emerald-50" },
        { section: "Review Metrics", label: "Hidden Reviews", value: analytics?.reviews?.hiddenReviews || 0, icon: HiOutlineStar, color: "text-red-600 bg-red-50" },
        { section: "Review Metrics", label: "Average Freelancer Rating", value: analytics?.reviews?.averageFreelancerRating || 0, icon: HiOutlineStar, color: "text-violet-600 bg-violet-50" },
        { section: "Review Metrics", label: "Average Client Rating", value: analytics?.reviews?.averageClientRating || 0, icon: HiOutlineStar, color: "text-teal-600 bg-teal-50" },
        { section: "Deliverable Metrics", label: "Total Deliverables", value: analytics?.deliverables?.totalDeliverables || 0, icon: HiOutlineDocumentCheck, color: "text-blue-600 bg-blue-50" },
        { section: "Deliverable Metrics", label: "Pending Deliverables", value: analytics?.deliverables?.pendingDeliverables || 0, icon: HiOutlineDocumentCheck, color: "text-amber-600 bg-amber-50" },
        { section: "Deliverable Metrics", label: "Approved Deliverables", value: analytics?.deliverables?.approvedDeliverables || 0, icon: HiOutlineDocumentCheck, color: "text-emerald-600 bg-emerald-50" },
        { section: "Deliverable Metrics", label: "Rejected Deliverables", value: analytics?.deliverables?.rejectedDeliverables || 0, icon: HiOutlineDocumentCheck, color: "text-red-600 bg-red-50" }
    ];

    const sections = [...new Set(cards.map((card) => card.section))];

    return (
        <div className="space-y-6 animate-fade-in">
            <AdminPageHeader eyebrow="Administration" title="Analytics" description="Expanded operational metrics without charts." />
            {sections.map((section) => (
                <section key={section} className="space-y-3">
                    <h2 className="text-lg font-semibold text-surface-900">{section}</h2>
                    <DashboardStats stats={cards.filter((card) => card.section === section)} isLoading={isLoading} error={error} />
                </section>
            ))}
        </div>
    );
}
