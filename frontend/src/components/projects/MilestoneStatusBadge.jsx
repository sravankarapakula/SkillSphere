const statusConfig = {
    pending: {
        label: "Pending",
        className: "bg-amber-50 text-amber-700 border-amber-200"
    },
    in_progress: {
        label: "In Progress",
        className: "bg-blue-50 text-blue-700 border-blue-200"
    },
    submitted: {
        label: "Submitted",
        className: "bg-violet-50 text-violet-700 border-violet-200"
    },
    approved: {
        label: "Approved",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    overdue: {
        label: "Overdue",
        className: "bg-red-50 text-red-700 border-red-200"
    }
};

export default function MilestoneStatusBadge({ status }) {
    const config = statusConfig[status] || statusConfig.pending;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.className}`}>
            {config.label}
        </span>
    );
}
