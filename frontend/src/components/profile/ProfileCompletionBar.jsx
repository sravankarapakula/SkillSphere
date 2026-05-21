export default function ProfileCompletionBar({ score = 0 }) {
    const getColor = () => {
        if (score >= 80) return "bg-emerald-500";
        if (score >= 50) return "bg-amber-500";
        return "bg-red-400";
    };

    const getLabel = () => {
        if (score >= 80) return "Great profile!";
        if (score >= 50) return "Getting there";
        return "Needs more info";
    };

    return (
        <div className="bg-white rounded-xl border border-surface-200 p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-surface-800">
                    Profile Completion
                </h3>
                <span className="text-sm font-bold text-surface-900">{score}%</span>
            </div>
            <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${getColor()}`}
                    style={{ width: `${score}%` }}
                />
            </div>
            <p className="text-xs text-surface-500 mt-2">{getLabel()}</p>
        </div>
    );
}
