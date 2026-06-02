import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    HiOutlineHome,
    HiOutlineUser,
    HiOutlineBriefcase,
    HiOutlineChatBubbleLeftRight,
    HiOutlineCog6Tooth,
    HiOutlineUsers,
    HiOutlineChartBarSquare,
    HiOutlineDocumentText,
    HiOutlineDocumentCheck,
    HiOutlineStar,
    HiOutlineXMark,
    HiOutlineMagnifyingGlass,
    HiOutlineFolderOpen,
    HiOutlineQueueList,
    HiOutlineCreditCard
} from "react-icons/hi2";

const freelancerLinks = [
    { to: "/dashboard", label: "Dashboard", icon: HiOutlineHome, end: true },
    { to: "/dashboard/profile", label: "My Profile", icon: HiOutlineUser },
    { to: "/dashboard/projects", label: "Projects", icon: HiOutlineBriefcase },
    { to: "/dashboard/proposals", label: "Proposals", icon: HiOutlineDocumentText },
    { to: "/dashboard/my-projects", label: "My Projects", icon: HiOutlineFolderOpen },
    { to: "/dashboard/tasks", label: "Tasks", icon: HiOutlineQueueList },
    { to: "/dashboard/messages", label: "Messages", icon: HiOutlineChatBubbleLeftRight },
    { to: "/dashboard/payments", label: "My Earnings", icon: HiOutlineCreditCard },
    { to: "/dashboard/settings", label: "Settings", icon: HiOutlineCog6Tooth }
];

const clientLinks = [
    { to: "/dashboard", label: "Dashboard", icon: HiOutlineHome, end: true },
    { to: "/dashboard/browse", label: "Browse Talent", icon: HiOutlineMagnifyingGlass },
    { to: "/dashboard/gigs/my", label: "My Gigs", icon: HiOutlineBriefcase },
    { to: "/dashboard/my-projects", label: "My Projects", icon: HiOutlineFolderOpen },
    { to: "/dashboard/messages", label: "Messages", icon: HiOutlineChatBubbleLeftRight },
    { to: "/dashboard/payments", label: "My Payments", icon: HiOutlineCreditCard },
    { to: "/dashboard/settings", label: "Settings", icon: HiOutlineCog6Tooth }
];

const adminLinks = [
    { to: "/dashboard", label: "Dashboard", icon: HiOutlineHome, end: true },
    { to: "/admin/users", label: "Users", icon: HiOutlineUsers },
    { to: "/admin/analytics", label: "Analytics", icon: HiOutlineChartBarSquare },
    { to: "/admin/gigs", label: "All Gigs", icon: HiOutlineBriefcase },
    { to: "/admin/projects", label: "Projects", icon: HiOutlineFolderOpen },
    { to: "/admin/reviews", label: "Reviews", icon: HiOutlineStar },
    { to: "/admin/deliverables", label: "Deliverables", icon: HiOutlineDocumentCheck },
    { to: "/dashboard/payments", label: "Transactions", icon: HiOutlineCreditCard },
    { to: "/dashboard/settings", label: "Settings", icon: HiOutlineCog6Tooth }
];

function getLinksForRole(role) {
    switch (role) {
        case "freelancer":
            return freelancerLinks;
        case "admin":
            return adminLinks;
        default:
            return clientLinks;
    }
}

export default function Sidebar({ isOpen, onClose }) {
    const { user } = useSelector((state) => state.auth);
    const { totalUnread = 0 } = useSelector((state) => state.message || {});
    const links = getLinksForRole(user?.role);

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-screen w-64
                    bg-white border-r border-surface-200
                    flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {/* Top: Logo (desktop) / Logo + close (mobile) */}
                <div className="flex items-center justify-between h-16 px-5 border-b border-surface-200 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">S</span>
                        </div>
                        <span className="text-lg font-bold text-surface-900">
                            Skill<span className="gradient-text">Sphere</span>
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 cursor-pointer lg:hidden"
                    >
                        <HiOutlineXMark className="h-5 w-5" />
                    </button>
                </div>

                {/* Middle: Navigation links (scrollable) */}
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3 px-3">
                        Menu
                    </p>
                    <div className="flex flex-col gap-1">
                        {links.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                    ${
                                        isActive
                                            ? "bg-primary-50 text-primary-700 shadow-sm"
                                            : "text-surface-600 hover:bg-surface-50 hover:text-surface-800"
                                    }`
                                }
                            >
                                <link.icon className="h-5 w-5 flex-shrink-0" />
                                <span className="flex-1">{link.label}</span>
                                {link.label === "Messages" && totalUnread > 0 && (
                                    <span className="bg-danger text-white text-[10px] font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center flex-shrink-0 animate-fade-in">
                                        {totalUnread > 99 ? "99+" : totalUnread}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </nav>

                {/* Bottom: User info */}
                <div className="flex-shrink-0 p-3 border-t border-surface-200">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-50 transition">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-surface-800 truncate">
                                {user?.name}
                            </p>
                            <p className="text-xs text-surface-500 capitalize">
                                {user?.role}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
