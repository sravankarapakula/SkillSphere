import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { HiOutlineCheckCircle, HiOutlineEye, HiOutlineNoSymbol } from "react-icons/hi2";
import * as adminApi from "../../api/adminApi";
import { fetchAdminGigs } from "../../redux/slices/adminSlice";
import { AdminPageHeader, AdminSearch, AdminSelect, FilterBar, ReasonModal, StatusBadge, TableShell } from "./AdminShared";
import { formatDate, money } from "./adminFormat";

export default function AdminGigsPage() {
    const dispatch = useDispatch();
    const { list: gigs, isLoading, error } = useSelector((state) => state.admin);
    const [params, setParams] = useSearchParams();
    const [modal, setModal] = useState(null);
    const [reason, setReason] = useState("");

    const filters = useMemo(() => ({
        status: params.get("status") || "",
        search: params.get("search") || ""
    }), [params]);

    useEffect(() => {
        dispatch(fetchAdminGigs(Object.fromEntries(params)));
    }, [dispatch, params]);

    const updateFilter = (key, value) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        setParams(next);
    };

    const disable = async () => {
        try {
            await adminApi.disableGig(modal._id, reason);
            toast.success("Gig disabled");
            setModal(null);
            setReason("");
            dispatch(fetchAdminGigs(Object.fromEntries(params)));
        } catch (apiError) {
            toast.error(apiError.response?.data?.message || "Could not disable gig");
        }
    };

    const enable = async (gig) => {
        try {
            await adminApi.enableGig(gig._id);
            toast.success("Gig enabled");
            dispatch(fetchAdminGigs(Object.fromEntries(params)));
        } catch (apiError) {
            toast.error(apiError.response?.data?.message || "Could not enable gig");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <AdminPageHeader eyebrow="Moderation" title="All Gigs" description="Disable or restore marketplace visibility for gigs." />
            <FilterBar>
                <AdminSelect value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
                    <option value="">All Gigs</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                </AdminSelect>
                <AdminSearch placeholder="Search title" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
            </FilterBar>
            <TableShell isLoading={isLoading} error={error} empty={!gigs.length}>
                <table className="min-w-full text-sm">
                    <thead className="bg-surface-50 text-left text-xs font-semibold uppercase text-surface-500">
                        <tr>
                            {["Title", "Client", "Budget", "Status", "Proposals", "Created Date", "Actions"].map((head) => <th key={head} className="px-4 py-3 whitespace-nowrap">{head}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                        {gigs.map((gig) => (
                            <tr key={gig._id} className="hover:bg-surface-50">
                                <td className="px-4 py-3 font-semibold text-surface-900">{gig.title}</td>
                                <td className="px-4 py-3">{gig.client?.name || "-"}</td>
                                <td className="px-4 py-3">{money(gig.budgetMin)} - {money(gig.budgetMax)}</td>
                                <td className="px-4 py-3"><StatusBadge tone={gig.isDisabled ? "danger" : "success"}>{gig.isDisabled ? "Disabled" : "Active"}</StatusBadge></td>
                                <td className="px-4 py-3">{gig.proposalsCount || gig.proposals?.length || 0}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{formatDate(gig.createdAt)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Link to={`/admin/gigs/${gig._id}`} title="View details" className="p-2 rounded-lg hover:bg-surface-100 text-surface-600"><HiOutlineEye /></Link>
                                        {gig.isDisabled ? (
                                            <button title="Enable gig" className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-700" onClick={() => enable(gig)}><HiOutlineCheckCircle /></button>
                                        ) : (
                                            <button title="Disable gig" className="p-2 rounded-lg hover:bg-red-50 text-red-700" onClick={() => setModal(gig)}><HiOutlineNoSymbol /></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableShell>
            {modal && <ReasonModal title={`Disable ${modal.title}`} label="Reason for disabling" value={reason} onChange={setReason} onCancel={() => setModal(null)} onConfirm={disable} />}
        </div>
    );
}
