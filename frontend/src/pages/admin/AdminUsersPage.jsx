import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { HiOutlineEye, HiOutlineNoSymbol, HiOutlineCheckCircle } from "react-icons/hi2";
import * as adminApi from "../../api/adminApi";
import { fetchAdminUsers } from "../../redux/slices/adminSlice";
import { AdminPageHeader, AdminSearch, AdminSelect, FilterBar, ReasonModal, StatusBadge, TableShell } from "./AdminShared";
import { formatDate } from "./adminFormat";

export default function AdminUsersPage() {
    const dispatch = useDispatch();
    const { list: users, isLoading, error } = useSelector((state) => state.admin);
    const [params, setParams] = useSearchParams();
    const [modal, setModal] = useState(null);
    const [reason, setReason] = useState("");
    const [isMutating, setIsMutating] = useState(false);

    const filters = useMemo(() => ({
        role: params.get("role") || "",
        status: params.get("status") || "",
        search: params.get("search") || ""
    }), [params]);

    useEffect(() => {
        dispatch(fetchAdminUsers(Object.fromEntries(params)));
    }, [dispatch, params]);

    const updateFilter = (key, value) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        setParams(next);
    };

    const suspend = async () => {
        try {
            setIsMutating(true);
            await adminApi.suspendUser(modal._id, reason);
            toast.success("User suspended");
            setModal(null);
            setReason("");
            dispatch(fetchAdminUsers(Object.fromEntries(params)));
        } catch (apiError) {
            toast.error(apiError.response?.data?.message || "Could not suspend user");
        } finally {
            setIsMutating(false);
        }
    };

    const unsuspend = async (user) => {
        try {
            await adminApi.unsuspendUser(user._id);
            toast.success("User unsuspended");
            dispatch(fetchAdminUsers(Object.fromEntries(params)));
        } catch (apiError) {
            toast.error(apiError.response?.data?.message || "Could not unsuspend user");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <AdminPageHeader eyebrow="Administration" title="Users" description="Manage user access, reputation, and activity." />
            <FilterBar>
                <AdminSelect value={filters.role} onChange={(event) => updateFilter("role", event.target.value)}>
                    <option value="">All Users</option>
                    <option value="client">Clients</option>
                    <option value="freelancer">Freelancers</option>
                    <option value="admin">Admins</option>
                </AdminSelect>
                <AdminSelect value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                </AdminSelect>
                <AdminSearch placeholder="Search name or email" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
            </FilterBar>
            <TableShell isLoading={isLoading} error={error} empty={!users.length}>
                <table className="min-w-full text-sm">
                    <thead className="bg-surface-50 text-left text-xs font-semibold uppercase text-surface-500">
                        <tr>
                            {["Name", "Email", "Role", "Status", "Freelancer Rating", "Client Rating", "Projects", "Reviews", "Joined Date", "Actions"].map((head) => (
                                <th key={head} className="px-4 py-3 whitespace-nowrap">{head}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-surface-50">
                                <td className="px-4 py-3 font-semibold text-surface-900">{user.name}</td>
                                <td className="px-4 py-3 text-surface-600">{user.email}</td>
                                <td className="px-4 py-3 capitalize">{user.role}</td>
                                <td className="px-4 py-3"><StatusBadge tone={user.isSuspended ? "danger" : "success"}>{user.isSuspended ? "Suspended" : "Active"}</StatusBadge></td>
                                <td className="px-4 py-3">{user.freelancerRating || 0} ({user.freelancerReviewCount || 0})</td>
                                <td className="px-4 py-3">{user.clientRating || 0} ({user.clientReviewCount || 0})</td>
                                <td className="px-4 py-3">{user.projectsCount || 0}</td>
                                <td className="px-4 py-3">{user.reviewsCount || 0}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <Link to={`/admin/users/${user._id}`} title="View details" className="p-2 rounded-lg hover:bg-surface-100 text-surface-600"><HiOutlineEye /></Link>
                                        {user.isSuspended ? (
                                            <button title="Unsuspend user" className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-700" onClick={() => unsuspend(user)}><HiOutlineCheckCircle /></button>
                                        ) : (
                                            <button title="Suspend user" disabled={user.role === "admin"} className="p-2 rounded-lg hover:bg-red-50 text-red-700 disabled:opacity-40" onClick={() => setModal(user)}><HiOutlineNoSymbol /></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableShell>
            {modal && <ReasonModal title={`Suspend ${modal.name}`} label="Reason for suspension" value={reason} onChange={setReason} onCancel={() => setModal(null)} onConfirm={suspend} isLoading={isMutating} />}
        </div>
    );
}
