export default function ExperienceCard({ exp }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return "Present";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    };

    return (
        <div className="relative pl-6 pb-6 border-l-2 border-surface-200 last:pb-0">
            {/* Timeline dot */}
            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary-500 border-2 border-white shadow-sm" />

            <div className="bg-white rounded-xl border border-surface-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h4 className="font-semibold text-surface-900 text-sm">
                            {exp.role}
                        </h4>
                        <p className="text-sm text-primary-600 font-medium">
                            {exp.company}
                        </p>
                    </div>
                    <span className="text-xs text-surface-500 whitespace-nowrap bg-surface-50 px-2 py-1 rounded-md">
                        {formatDate(exp.startDate)} — {formatDate(exp.endDate)}
                    </span>
                </div>
                {exp.description && (
                    <p className="text-xs text-surface-500 mt-2 leading-relaxed">
                        {exp.description}
                    </p>
                )}
            </div>
        </div>
    );
}
