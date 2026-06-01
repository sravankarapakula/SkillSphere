import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2";
import * as adminApi from "../../api/adminApi";
import { fetchAdminReviews } from "../../redux/slices/adminSlice";
import { AdminPageHeader, AdminSearch, AdminSelect, FilterBar, StatusBadge, TableShell } from "./AdminShared";
import { formatDate } from "./adminFormat";

export default function AdminReviewsPage() {
    const dispatch = useDispatch();
    const { list: reviews, isLoading, error } = useSelector((state) => state.admin);
    const [params, setParams] = useSearchParams();
    const filters = useMemo(() => ({ type: params.get("type") || "", status: params.get("status") || "", search: params.get("search") || "" }), [params]);

    useEffect(() => {
        dispatch(fetchAdminReviews(Object.fromEntries(params)));
    }, [dispatch, params]);

    const updateFilter = (key, value) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        setParams(next);
    };

    const toggle = async (review) => {
        try {
            if (review.isHidden) await adminApi.restoreReview(review._id);
            else await adminApi.hideReview(review._id);
            toast.success(review.isHidden ? "Review restored" : "Review hidden");
            dispatch(fetchAdminReviews(Object.fromEntries(params)));
        } catch (apiError) {
            toast.error(apiError.response?.data?.message || "Could not update review");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <AdminPageHeader eyebrow="Monitoring" title="Reviews" description="Moderate review visibility and reputation impact." />
            <FilterBar>
                <AdminSelect value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
                    <option value="">All Reviews</option>
                    <option value="client">Client Reviews</option>
                    <option value="freelancer">Freelancer Reviews</option>
                </AdminSelect>
                <AdminSelect value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
                    <option value="">All Visibility</option>
                    <option value="hidden">Hidden Reviews</option>
                    <option value="visible">Visible Reviews</option>
                </AdminSelect>
                <AdminSearch placeholder="Search reviewer, reviewee, or project" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
            </FilterBar>
            <TableShell isLoading={isLoading} error={error} empty={!reviews.length}>
                <table className="min-w-full text-sm">
                    <thead className="bg-surface-50 text-left text-xs font-semibold uppercase text-surface-500">
                        <tr>{["Reviewer", "Reviewee", "Project", "Review Type", "Rating", "Created Date", "Status", "Actions"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                        {reviews.map((review) => (
                            <tr key={review._id} className="hover:bg-surface-50">
                                <td className="px-4 py-3">{review.reviewer?.name || "-"}</td>
                                <td className="px-4 py-3">{review.reviewee?.name || "-"}</td>
                                <td className="px-4 py-3">{review.project?.title || "Deleted Project"}</td>
                                <td className="px-4 py-3">{review.reviewType}</td>
                                <td className="px-4 py-3">{review.overallRating}/5</td>
                                <td className="px-4 py-3 whitespace-nowrap">{formatDate(review.createdAt)}</td>
                                <td className="px-4 py-3"><StatusBadge tone={review.isHidden ? "danger" : "success"}>{review.isHidden ? "Hidden" : "Visible"}</StatusBadge></td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Link to={`/admin/reviews/${review._id}`} className="p-2 rounded-lg hover:bg-surface-100 text-surface-600"><HiOutlineEye /></Link>
                                        <button className="p-2 rounded-lg hover:bg-surface-100 text-surface-600" onClick={() => toggle(review)}><HiOutlineEyeSlash /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableShell>
        </div>
    );
}
