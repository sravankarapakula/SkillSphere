import { HiOutlineDocumentText } from "react-icons/hi2";

export default function RecentActivity({ activities = [] }) {
    if (activities.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-surface-200 p-6">
                <h3 className="text-lg font-semibold text-surface-900 mb-4">
                    Recent Activity
                </h3>
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-14 w-14 rounded-full bg-surface-100 flex items-center justify-center mb-3">
                        <HiOutlineDocumentText className="h-7 w-7 text-surface-400" />
                    </div>
                    <p className="text-surface-500 text-sm">No recent activity</p>
                    <p className="text-surface-400 text-xs mt-1">
                        Your latest actions will appear here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">
                Recent Activity
            </h3>
            <div className="space-y-3">
                {activities.map((activity, i) => (
                    <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-50 transition"
                    >
                        <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                activity.color || "bg-primary-50 text-primary-600"
                            }`}
                        >
                            {activity.icon || (
                                <HiOutlineDocumentText className="h-4 w-4" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-surface-800 font-medium">
                                {activity.title}
                            </p>
                            <p className="text-xs text-surface-500 mt-0.5">
                                {activity.time}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
