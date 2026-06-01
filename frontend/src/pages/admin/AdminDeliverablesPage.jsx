import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { HiOutlineArrowDownTray, HiOutlineEye, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { fetchAdminDeliverables } from "../../redux/slices/adminSlice";
import { AdminPageHeader, AdminSelect, FilterBar, StatusBadge, TableShell } from "./AdminShared";
import { formatDate } from "./adminFormat";

const statusLabel = (status) => status === "submitted" ? "Pending Review" : status;

export default function AdminDeliverablesPage() {
    const dispatch = useDispatch();
    const { list: deliverables, isLoading, error } = useSelector((state) => state.admin);
    const [params, setParams] = useSearchParams();
    const filters = useMemo(() => ({ status: params.get("status") || "" }), [params]);

    useEffect(() => {
        dispatch(fetchAdminDeliverables(Object.fromEntries(params)));
    }, [dispatch, params]);

    const updateFilter = (value) => {
        const next = new URLSearchParams(params);
        if (value) next.set("status", value);
        else next.delete("status");
        setParams(next);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <AdminPageHeader eyebrow="Monitoring" title="Deliverables" description="Inspect submitted files, versions, and approval history." />
            <FilterBar>
                <AdminSelect value={filters.status} onChange={(event) => updateFilter(event.target.value)}>
                    <option value="">All Deliverables</option>
                    <option value="submitted">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </AdminSelect>
            </FilterBar>
            <TableShell isLoading={isLoading} error={error} empty={!deliverables.length}>
                <table className="min-w-full text-sm">
                    <thead className="bg-surface-50 text-left text-xs font-semibold uppercase text-surface-500">
                        <tr>{["Project", "Milestone", "Freelancer", "Version", "Status", "Submitted Date", "Actions"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                        {deliverables.map((deliverable) => (
                            <tr key={deliverable._id} className="hover:bg-surface-50">
                                <td className="px-4 py-3 font-semibold text-surface-900">{deliverable.project?.gig?.title || "Project"}</td>
                                <td className="px-4 py-3">{deliverable.milestone?.title || "-"}</td>
                                <td className="px-4 py-3">{deliverable.submittedBy?.name || "-"}</td>
                                <td className="px-4 py-3">v{deliverable.version}</td>
                                <td className="px-4 py-3"><StatusBadge tone={deliverable.status === "approved" ? "success" : deliverable.status === "rejected" ? "danger" : "warning"}>{statusLabel(deliverable.status)}</StatusBadge></td>
                                <td className="px-4 py-3 whitespace-nowrap">{formatDate(deliverable.createdAt)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Link title="View" to={`/admin/deliverables/${deliverable._id}`} className="p-2 rounded-lg hover:bg-surface-100 text-surface-600"><HiOutlineEye /></Link>
                                        {deliverable.files?.[0]?.url && <a title="Download" href={deliverable.files[0].url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-surface-100 text-surface-600"><HiOutlineArrowDownTray /></a>}
                                        <Link title="Investigate" to={`/admin/projects/${deliverable.project?._id}`} className="p-2 rounded-lg hover:bg-surface-100 text-surface-600"><HiOutlineMagnifyingGlass /></Link>
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
