import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Button from "../../components/shared/Button";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import * as adminApi from "../../api/adminApi";
import { fetchAdminUserDetails } from "../../redux/slices/adminSlice";
import { AdminPageHeader, DetailCard, FieldGrid, ReasonModal, StatusBadge } from "./AdminShared";
import { formatDate } from "./adminFormat";

export default function AdminUserDetailsPage() {
    const { userId } = useParams();
    const dispatch = useDispatch();
    const { detail, isLoading, error } = useSelector((state) => state.admin);
    const [reason, setReason] = useState("");
    const [showSuspend, setShowSuspend] = useState(false);

    useEffect(() => {
        dispatch(fetchAdminUserDetails(userId));
    }, [dispatch, userId]);

    if (isLoading) return <LoadingSpinner size="lg" />;
    if (error) return <div className="rounded-xl bg-red-50 border border-red-100 p-5 text-sm text-red-700">{error}</div>;
    if (!detail?.user) return null;

    const { user, activity, recent } = detail;

    const suspend = async () => {
        try {
            await adminApi.suspendUser(user._id, reason);
            toast.success("User suspended");
            setShowSuspend(false);
            setReason("");
            dispatch(fetchAdminUserDetails(userId));
        } catch (apiError) {
            toast.error(apiError.response?.data?.message || "Could not suspend user");
        }
    };

    const unsuspend = async () => {
        try {
            await adminApi.unsuspendUser(user._id);
            toast.success("User unsuspended");
            dispatch(fetchAdminUserDetails(userId));
        } catch (apiError) {
            toast.error(apiError.response?.data?.message || "Could not unsuspend user");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <AdminPageHeader
                eyebrow="User Details"
                title={user.name}
                description={user.email}
                actions={user.isSuspended ? <Button variant="secondary" onClick={unsuspend}>Unsuspend User</Button> : <Button variant="danger" disabled={user.role === "admin"} onClick={() => setShowSuspend(true)}>Suspend User</Button>}
            />
            <DetailCard title="Profile">
                <div className="flex items-center gap-4 mb-5">
                    <div className="h-16 w-16 rounded-full bg-primary-50 flex items-center justify-center overflow-hidden">
                        {user.profileImage ? <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" /> : <span className="font-bold text-primary-700">{user.name?.[0]}</span>}
                    </div>
                    <StatusBadge tone={user.isSuspended ? "danger" : "success"}>{user.isSuspended ? "Suspended" : "Active"}</StatusBadge>
                </div>
                <FieldGrid items={[
                    { label: "Name", value: user.name },
                    { label: "Email", value: user.email },
                    { label: "Role", value: user.role },
                    { label: "Joined Date", value: formatDate(user.createdAt) }
                ]} />
            </DetailCard>
            <DetailCard title="Reputation">
                <FieldGrid items={[
                    { label: "Freelancer Rating", value: user.freelancerRating || 0 },
                    { label: "Freelancer Reviews", value: user.freelancerReviewCount || 0 },
                    { label: "Client Rating", value: user.clientRating || 0 },
                    { label: "Client Reviews", value: user.clientReviewCount || 0 }
                ]} />
            </DetailCard>
            <DetailCard title="Activity">
                <FieldGrid items={[
                    { label: "Projects Count", value: activity.projectsCount },
                    { label: "Proposals Count", value: activity.proposalsCount },
                    { label: "Reviews Count", value: activity.reviewsCount },
                    { label: "Deliverables Count", value: activity.deliverablesCount }
                ]} />
            </DetailCard>
            <DetailCard title="Recent Activity">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 text-sm">
                    <ActivityList title="Recent Projects" items={recent.projects.map((project) => `${project.gig?.title || "Project"} - ${project.status}`)} />
                    <ActivityList title="Recent Reviews" items={recent.reviews.map((review) => `${review.project?.title || "Project"} - ${review.overallRating}/5`)} />
                    <ActivityList title="Recent Deliverables" items={recent.deliverables.map((deliverable) => `${deliverable.milestone?.title || "Milestone"} - v${deliverable.version}`)} />
                </div>
            </DetailCard>
            {showSuspend && <ReasonModal title={`Suspend ${user.name}`} label="Reason for suspension" value={reason} onChange={setReason} onCancel={() => setShowSuspend(false)} onConfirm={suspend} />}
        </div>
    );
}

function ActivityList({ title, items }) {
    return (
        <div>
            <h3 className="font-semibold text-surface-800 mb-3">{title}</h3>
            <div className="space-y-2">
                {items.length ? items.map((item) => <p key={item} className="rounded-lg bg-surface-50 px-3 py-2 text-surface-600">{item}</p>) : <p className="text-surface-400">No activity.</p>}
            </div>
        </div>
    );
}
