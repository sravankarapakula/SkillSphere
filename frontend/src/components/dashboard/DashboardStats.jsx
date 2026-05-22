import StatCard from "./StatCard";

export default function DashboardStats({ stats, isLoading, error }) {
    if (isLoading && !stats) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-36 bg-white border border-surface-200 rounded-xl p-5 animate-pulse"
                    >
                        <div className="h-10 w-10 rounded-lg bg-surface-100 mb-4" />
                        <div className="h-7 w-16 rounded bg-surface-100 mb-2" />
                        <div className="h-4 w-28 rounded bg-surface-100" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {error} Showing the latest available values.
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>
        </div>
    );
}
