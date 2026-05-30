import { Link } from "react-router-dom";

export default function StatCard({ label, value, icon: Icon, color, trend, to }) {
    const cardContent = (
        <div className="bg-white rounded-xl border border-surface-200 p-5 hover:shadow-md transition-all duration-300 group h-full">
            <div className="flex items-center justify-between mb-3">
                <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
                {trend !== undefined && (
                    <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            trend >= 0
                                ? "bg-emerald-55 text-emerald-600"
                                : "bg-red-55 text-red-600"
                        }`}
                    >
                        {trend >= 0 ? "+" : ""}
                        {trend}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-surface-900 group-hover:text-primary-700 transition-colors">
                {value}
            </p>
            <p className="text-sm text-surface-500 mt-1">{label}</p>
        </div>
    );

    if (to) {
        return (
            <Link to={to} className="block cursor-pointer">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
}
