import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { fetchAdminDeliverableDetails } from "../../redux/slices/adminSlice";
import { AdminPageHeader, DetailCard, FieldGrid, StatusBadge } from "./AdminShared";
import { formatDate } from "./adminFormat";

const statusLabel = (status) => status === "submitted" ? "Pending Review" : status;

export default function AdminDeliverableDetailsPage() {
    const { deliverableId } = useParams();
    const dispatch = useDispatch();
    const { detail, isLoading, error } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(fetchAdminDeliverableDetails(deliverableId));
    }, [dispatch, deliverableId]);

    if (isLoading) return <LoadingSpinner size="lg" />;
    if (error) return <div className="rounded-xl bg-red-50 border border-red-100 p-5 text-sm text-red-700">{error}</div>;
    if (!detail?.deliverable) return null;

    const { deliverable, versionHistory } = detail;

    return (
        <div className="space-y-6 animate-fade-in">
            <AdminPageHeader eyebrow="Deliverable Details" title={deliverable.project?.gig?.title || "Deliverable"} description="Read-only file and approval inspection." />
            <DetailCard title="Submission">
                <FieldGrid items={[
                    { label: "Project", value: deliverable.project?.gig?.title },
                    { label: "Milestone", value: deliverable.milestone?.title },
                    { label: "Freelancer", value: deliverable.submittedBy?.name },
                    { label: "Version", value: `v${deliverable.version}` },
                    { label: "Status", value: <StatusBadge>{statusLabel(deliverable.status)}</StatusBadge> },
                    { label: "Submitted Date", value: formatDate(deliverable.createdAt) }
                ]} />
                <p className="text-sm text-surface-600 mt-5 leading-relaxed">{deliverable.notes || "No submission notes."}</p>
            </DetailCard>
            <DetailCard title="Uploaded Files">
                <div className="space-y-2">
                    {deliverable.files?.map((file) => (
                        <a key={file._id || file.url} href={file.url} target="_blank" rel="noreferrer" className="rounded-lg border border-surface-200 p-3 text-sm flex justify-between gap-3 hover:bg-surface-50">
                            <span>{file.fileName}</span>
                            <span className="text-surface-500">{file.fileType}</span>
                        </a>
                    ))}
                </div>
            </DetailCard>
            <DetailCard title="Version History">
                <div className="space-y-2">
                    {versionHistory.map((item) => (
                        <div key={item._id} className="rounded-lg border border-surface-200 p-3 text-sm grid gap-2 md:grid-cols-4">
                            <span>v{item.version}</span>
                            <span>{statusLabel(item.status)}</span>
                            <span>{formatDate(item.createdAt)}</span>
                            <span>{item.reviewedBy?.name || "Not reviewed"}</span>
                        </div>
                    ))}
                </div>
            </DetailCard>
            <DetailCard title="Approval History">
                <FieldGrid items={[
                    { label: "Reviewed By", value: deliverable.reviewedBy?.name || "Not reviewed" },
                    { label: "Reviewed At", value: formatDate(deliverable.reviewedAt) },
                    { label: "Feedback", value: deliverable.reviewFeedback || "-" }
                ]} />
            </DetailCard>
        </div>
    );
}
