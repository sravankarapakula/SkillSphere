import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Button from "../../components/shared/Button";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import * as adminApi from "../../api/adminApi";
import { fetchAdminReviewDetails } from "../../redux/slices/adminSlice";
import { AdminPageHeader, DetailCard, FieldGrid, StatusBadge } from "./AdminShared";
import { formatDate } from "./adminFormat";

export default function AdminReviewDetailsPage() {
    const { reviewId } = useParams();
    const dispatch = useDispatch();
    const { detail, isLoading, error } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(fetchAdminReviewDetails(reviewId));
    }, [dispatch, reviewId]);

    if (isLoading) return <LoadingSpinner size="lg" />;
    if (error) return <div className="rounded-xl bg-red-50 border border-red-100 p-5 text-sm text-red-700">{error}</div>;
    if (!detail?.review) return null;

    const review = detail.review;
    const toggle = async () => {
        if (review.isHidden) await adminApi.restoreReview(review._id);
        else await adminApi.hideReview(review._id);
        toast.success(review.isHidden ? "Review restored" : "Review hidden");
        dispatch(fetchAdminReviewDetails(reviewId));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <AdminPageHeader
                eyebrow="Review Details"
                title={review.project?.title || "Deleted Project"}
                actions={<Button variant={review.isHidden ? "secondary" : "danger"} onClick={toggle}>{review.isHidden ? "Restore Review" : "Hide Review"}</Button>}
            />
            <DetailCard title="Review">
                <FieldGrid items={[
                    { label: "Project Title", value: review.project?.title || "Deleted Project" },
                    { label: "Project ID", value: review.project?._id || "-" },
                    { label: "Project Status", value: review.project?.status ? <StatusBadge>{review.project.status}</StatusBadge> : "-" },
                    { label: "Reviewer", value: review.reviewer?.name || "-" },
                    { label: "Reviewee", value: review.reviewee?.name || "-" },
                    { label: "Review Type", value: review.reviewType },
                    { label: "Overall Rating", value: `${review.overallRating}/5` },
                    { label: "Created Date", value: formatDate(review.createdAt) },
                    { label: "Status", value: <StatusBadge tone={review.isHidden ? "danger" : "success"}>{review.isHidden ? "Hidden" : "Visible"}</StatusBadge> }
                ]} />
                <div className="mt-5">
                    <h3 className="text-sm font-semibold text-surface-900">Category Ratings</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(review.ratings || {}).map(([key, value]) => <StatusBadge key={key}>{key}: {value}</StatusBadge>)}
                    </div>
                    <p className="text-sm text-surface-600 mt-5 leading-relaxed">{review.comment || "No comment."}</p>
                </div>
            </DetailCard>
        </div>
    );
}
