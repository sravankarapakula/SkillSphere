import { HiOutlineBell } from "react-icons/hi2";

export default function NotificationPanel({ notifications = [] }) {
    const items = notifications;

    return (
        <div className="bg-white rounded-xl border border-surface-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-surface-900">
                    Notifications
                </h3>
                <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                    {items.filter((n) => !n.read).length} new
                </span>
            </div>
            {items.length === 0 ? (
                <p className="rounded-lg bg-surface-50 border border-surface-100 px-3 py-6 text-center text-sm text-surface-500">
                    No notifications yet
                </p>
            ) : (
                <div className="space-y-3">
                {items.map((notif) => (
                    <div
                        key={notif.id}
                        className={`flex items-start gap-3 p-3 rounded-lg transition ${
                            notif.read
                                ? "bg-white"
                                : "bg-primary-50/50 border border-primary-100"
                        }`}
                    >
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <HiOutlineBell className="h-4 w-4 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-surface-800">
                                {notif.title}
                            </p>
                            <p className="text-xs text-surface-500 mt-0.5">
                                {notif.message}
                            </p>
                            <p className="text-xs text-surface-400 mt-1">
                                {notif.time}
                            </p>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </div>
    );
}
