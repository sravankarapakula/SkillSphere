import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { HiOutlineEye } from "react-icons/hi2";
import { fetchAdminProjects } from "../../redux/slices/adminSlice";
import { AdminPageHeader, AdminSearch, AdminSelect, FilterBar, StatusBadge, TableShell } from "./AdminShared";
import { formatDate } from "./adminFormat";

export default function AdminProjectsPage() {
    const dispatch = useDispatch();
    const { list: projects, isLoading, error } = useSelector((state) => state.admin);
    const [params, setParams] = useSearchParams();
    const filters = useMemo(() => ({ status: params.get("status") || "", search: params.get("search") || "" }), [params]);

    useEffect(() => {
        dispatch(fetchAdminProjects(Object.fromEntries(params)));
    }, [dispatch, params]);

    const updateFilter = (key, value) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        setParams(next);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <AdminPageHeader eyebrow="Monitoring" title="Projects" description="Read-only visibility into active project work." />
            <FilterBar>
                <AdminSelect value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
                    <option value="">All</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                </AdminSelect>
                <AdminSearch placeholder="Search project, client, or freelancer" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
            </FilterBar>
            <TableShell isLoading={isLoading} error={error} empty={!projects.length}>
                <table className="min-w-full text-sm">
                    <thead className="bg-surface-50 text-left text-xs font-semibold uppercase text-surface-500">
                        <tr>{["Project", "Client", "Freelancer", "Status", "Progress", "Milestones", "Created Date", ""].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                        {projects.map((project) => (
                            <tr key={project._id} className="hover:bg-surface-50">
                                <td className="px-4 py-3 font-semibold text-surface-900">{project.gig?.title || "Project"}</td>
                                <td className="px-4 py-3">{project.client?.name || "-"}</td>
                                <td className="px-4 py-3">{project.freelancer?.name || "-"}</td>
                                <td className="px-4 py-3"><StatusBadge tone="primary">{project.status}</StatusBadge></td>
                                <td className="px-4 py-3">{project.progressPercentage || 0}%</td>
                                <td className="px-4 py-3">{project.milestonesCount || 0}</td>
                                <td className="px-4 py-3 whitespace-nowrap">{formatDate(project.createdAt)}</td>
                                <td className="px-4 py-3"><Link to={`/admin/projects/${project._id}`} className="p-2 rounded-lg hover:bg-surface-100 text-surface-600 inline-flex"><HiOutlineEye /></Link></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </TableShell>
        </div>
    );
}
