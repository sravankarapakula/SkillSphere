const colors = {
    pending: "bg-amber-50 text-amber-700",
    accepted: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
    open: "bg-primary-50 text-primary-700",
    closed: "bg-surface-100 text-surface-600"
};

export default function StatusBadge({ status }) {
    return (
        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
            colors[status] || colors.pending
        }`}>
            {status}
        </span>
    );
}
