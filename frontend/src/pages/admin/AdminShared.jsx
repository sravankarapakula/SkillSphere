import LoadingSpinner from "../../components/shared/LoadingSpinner";

export function AdminPageHeader({ eyebrow, title, description, actions }) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p className="text-sm font-medium text-primary-600">{eyebrow}</p>
                <h1 className="text-2xl font-bold text-surface-900 mt-1">{title}</h1>
                {description && <p className="text-sm text-surface-500 mt-2">{description}</p>}
            </div>
            {actions}
        </div>
    );
}

export function StatusBadge({ children, tone = "surface" }) {
    const tones = {
        success: "bg-emerald-50 text-emerald-700 border-emerald-100",
        danger: "bg-red-50 text-red-700 border-red-100",
        warning: "bg-amber-50 text-amber-700 border-amber-100",
        primary: "bg-primary-50 text-primary-700 border-primary-100",
        surface: "bg-surface-100 text-surface-700 border-surface-200"
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
            {children}
        </span>
    );
}

export function FilterBar({ children }) {
    return (
        <div className="bg-white border border-surface-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
            {children}
        </div>
    );
}

export function AdminSelect(props) {
    return <select className="filter-input max-w-56" {...props} />;
}

export function AdminSearch(props) {
    return <input className="filter-input max-w-sm" {...props} />;
}

export function TableShell({ isLoading, error, empty, children }) {
    if (isLoading) {
        return <div className="bg-white border border-surface-200 rounded-xl py-20"><LoadingSpinner size="lg" /></div>;
    }

    if (error) {
        return <div className="rounded-xl bg-red-50 border border-red-100 p-5 text-sm text-red-700">{error}</div>;
    }

    return (
        <div className="bg-white border border-surface-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                {children}
            </div>
            {empty && <div className="px-6 py-12 text-center text-sm text-surface-500">No records found.</div>}
        </div>
    );
}

export function DetailCard({ title, children }) {
    return (
        <section className="bg-white border border-surface-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-surface-900 mb-4">{title}</h2>
            {children}
        </section>
    );
}

export function FieldGrid({ items }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {items.map((item) => (
                <div key={item.label} className="rounded-lg border border-surface-200 p-4">
                    <p className="text-xs font-semibold uppercase text-surface-400">{item.label}</p>
                    <p className="text-sm font-semibold text-surface-900 mt-2 break-words">{item.value ?? "-"}</p>
                </div>
            ))}
        </div>
    );
}

export function ReasonModal({ title, label, value, onChange, onCancel, onConfirm, isLoading }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white border border-surface-200 p-6 shadow-xl">
                <h2 className="text-lg font-bold text-surface-900">{title}</h2>
                <label className="field-label mt-5">{label}</label>
                <textarea
                    className="form-input min-h-28"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    autoFocus
                />
                <div className="flex justify-end gap-3 mt-5">
                    <button className="px-4 py-2 text-sm font-semibold text-surface-600 hover:bg-surface-100 rounded-xl" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-semibold text-white bg-danger hover:bg-red-600 rounded-xl disabled:opacity-50"
                        disabled={!value.trim() || isLoading}
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
