import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import {
    HiOutlineBell,
    HiOutlineChevronDown,
    HiOutlineArrowRightOnRectangle,
    HiOutlineUserCircle,
    HiOutlineCog6Tooth,
    HiBars3
} from "react-icons/hi2";

export default function Navbar({ onToggleSidebar }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { notificationsTotal = 0 } = useSelector((state) => state.message || {});

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    const initials = user?.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "U";

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-surface-200 px-4 lg:px-8 flex items-center justify-between">
            {/* Left: hamburger + logo */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 rounded-lg hover:bg-surface-100 text-surface-600 cursor-pointer"
                    id="sidebar-toggle"
                >
                    <HiBars3 className="h-5 w-5" />
                </button>
                <Link to="/dashboard" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <span className="text-lg font-bold text-surface-900 hidden sm:block">
                        Skill<span className="gradient-text">Sphere</span>
                    </span>
                </Link>
            </div>

            {/* Right: notifications + user menu */}
            <div className="flex items-center gap-2">
                {/* Notification bell */}
                <button className="relative p-2 rounded-lg hover:bg-surface-100 text-surface-500 transition cursor-pointer" id="notification-bell">
                    <HiOutlineBell className="h-5 w-5" />
                    {notificationsTotal > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                            {notificationsTotal > 99 ? "99+" : notificationsTotal}
                        </span>
                    )}
                </button>

                {/* User dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 p-1.5 pl-3 rounded-xl hover:bg-surface-100 transition cursor-pointer"
                        id="user-menu-button"
                    >
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-semibold text-surface-800 leading-tight">
                                {user?.name}
                            </p>
                            <p className="text-xs text-surface-500 capitalize">
                                {user?.role}
                            </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                            {initials}
                        </div>
                        <HiOutlineChevronDown
                            className={`h-4 w-4 text-surface-400 transition-transform ${
                                dropdownOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {/* Dropdown */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-surface-200 py-2 animate-fade-in">
                            <div className="px-4 py-2 border-b border-surface-100">
                                <p className="text-sm font-semibold text-surface-800">
                                    {user?.name}
                                </p>
                                <p className="text-xs text-surface-500">
                                    {user?.email}
                                </p>
                            </div>
                            <Link
                                to="/dashboard/profile"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition"
                            >
                                <HiOutlineUserCircle className="h-4 w-4" />
                                My Profile
                            </Link>
                            <Link
                                to="/dashboard/settings"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition"
                            >
                                <HiOutlineCog6Tooth className="h-4 w-4" />
                                Settings
                            </Link>
                            <div className="border-t border-surface-100 mt-1 pt-1">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-danger hover:bg-red-50 transition cursor-pointer"
                                    id="logout-button"
                                >
                                    <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
