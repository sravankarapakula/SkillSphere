import { Link } from "react-router-dom";

export default function QuickActions({ actions = [] }) {
    return (
        <div className="bg-white rounded-xl border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">
                Quick Actions
            </h3>
            <div className="space-y-3">
                {actions.map((action, i) => (
                    <Link
                        key={i}
                        to={action.to}
                        className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200 group"
                    >
                        {action.icon && (
                            <div className="h-9 w-9 rounded-lg bg-surface-100 group-hover:bg-primary-100 flex items-center justify-center flex-shrink-0 transition-colors">
                                <action.icon className="h-4.5 w-4.5 text-surface-500 group-hover:text-primary-600 transition-colors" />
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-semibold text-surface-800 group-hover:text-primary-700 transition-colors">
                                {action.label}
                            </p>
                            {action.description && (
                                <p className="text-xs text-surface-500 mt-0.5">
                                    {action.description}
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
