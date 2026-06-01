import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { fetchAdminProjectDetails } from "../../redux/slices/adminSlice";
import { AdminPageHeader, DetailCard, FieldGrid, StatusBadge } from "./AdminShared";
import { formatDate, money } from "./adminFormat";

export default function AdminProjectDetailsPage() {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const { detail, isLoading, error } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(fetchAdminProjectDetails(projectId));
    }, [dispatch, projectId]);

    if (isLoading) return <LoadingSpinner size="lg" />;
    if (error) return <div className="rounded-xl bg-red-50 border border-red-100 p-5 text-sm text-red-700">{error}</div>;
    if (!detail?.project) return null;

    const { project, milestones, deliverables, reviews } = detail;

    return (
        <div className="space-y-6 animate-fade-in">
            <AdminPageHeader eyebrow="Project Details" title={project.gig?.title || "Project"} description="Read-only project monitoring." />
            <DetailCard title="Project Overview">
                <FieldGrid items={[
                    { label: "Title", value: project.gig?.title },
                    { label: "Budget", value: money(project.agreedAmount) },
                    { label: "Status", value: <StatusBadge tone="primary">{project.status}</StatusBadge> },
                    { label: "Progress", value: `${project.progressPercentage || 0}%` }
                ]} />
                <p className="text-sm text-surface-600 mt-5 leading-relaxed">{project.gig?.description || "No description."}</p>
            </DetailCard>
            <DetailCard title="Participants">
                <FieldGrid items={[
                    { label: "Client", value: `${project.client?.name || "-"} (${project.client?.email || "-"})` },
                    { label: "Freelancer", value: `${project.freelancer?.name || "-"} (${project.freelancer?.email || "-"})` }
                ]} />
            </DetailCard>
            <DetailCard title="Milestones">
                <SimpleRows rows={milestones.map((item) => [item.title, item.status, formatDate(item.dueDate)])} empty="No milestones." />
            </DetailCard>
            <DetailCard title="Deliverables">
                <SimpleRows rows={deliverables.map((item) => [`${item.milestone?.title || "Milestone"} v${item.version}`, item.status, `${item.files?.length || 0} files`])} empty="No deliverables." />
            </DetailCard>
            <DetailCard title="Reviews">
                <SimpleRows rows={reviews.map((item) => [item.reviewer?.name, item.reviewee?.name, `${item.overallRating}/5`, item.comment || "-"])} empty="No reviews." />
            </DetailCard>
        </div>
    );
}

function SimpleRows({ rows, empty }) {
    if (!rows.length) return <p className="text-sm text-surface-500">{empty}</p>;
    return (
        <div className="space-y-2">
            {rows.map((row, index) => (
                <div key={index} className="rounded-lg border border-surface-200 p-3 text-sm grid gap-2 md:grid-cols-4">
                    {row.map((cell, cellIndex) => <span key={cellIndex} className="text-surface-700 break-words">{cell}</span>)}
                </div>
            ))}
        </div>
    );
}
