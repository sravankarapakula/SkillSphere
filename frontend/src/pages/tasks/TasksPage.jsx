import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import {
    HiOutlineQueueList,
    HiOutlineFolderOpen,
    HiOutlineClock,
    HiOutlineCalendarDays,
    HiOutlineMagnifyingGlass,
    HiOutlineFunnel
} from "react-icons/hi2";
import { getUpcomingTasks } from "../../api/taskApi";
import { getUserProjects } from "../../api/projectApi";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import MilestoneStatusBadge from "../../components/projects/MilestoneStatusBadge";

const formatTimeRemaining = (timeRemaining, isOverdue, dueDate) => {
    if (isOverdue) {
        if (!dueDate) return "Overdue";
        const ms = Date.now() - new Date(dueDate).getTime();
        if (ms <= 0) return "Overdue";
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        if (days > 0) return `Overdue by ${days}d ${remainingHours}h`;
        return `Overdue by ${hours}h`;
    }
    
    if (!timeRemaining || timeRemaining <= 0) return "Due soon";
    
    const seconds = Math.floor(timeRemaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) return `Due in ${days}d ${remainingHours}h`;
    return `Due in ${hours}h`;
};

export default function TasksPage() {
    const [searchParams] = useSearchParams();
    const urlFilter = searchParams.get("filter"); // e.g. "overdue" or "this-week"

    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Quick Filters State
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [projectFilter, setProjectFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState(urlFilter || "all");

    // Sorting State
    const [sortBy, setSortBy] = useState("dueDate");
    const [sortOrder, setSortOrder] = useState("asc");

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Realtime update selector
    const lastUpdated = useSelector((state) => state.milestone.lastUpdated);

    // Fetch projects on mount for project dropdown filter
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await getUserProjects();
                if (res.success) {
                    setProjects(res.data.projects || []);
                }
            } catch (err) {
                console.error("Failed to load projects for dropdown", err);
            }
        };
        fetchProjects();
    }, []);

    // Handle search debouncing
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Handle URL filter change dynamically
    useEffect(() => {
        if (urlFilter) {
            setTimeFilter(urlFilter);
        }
    }, [urlFilter]);

    // Fetch tasks from API based on active filters/sorting/pagination
    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const params = {
                page,
                limit,
                search: debouncedSearch,
                status: statusFilter,
                priority: priorityFilter,
                project: projectFilter,
                dueDate: timeFilter,
                sortBy,
                sortOrder
            };
            const data = await getUpcomingTasks(params);
            if (data.success) {
                setTasks(data.data.tasks || []);
                if (data.data.pagination) {
                    setTotalCount(data.data.pagination.totalCount || 0);
                    setTotalPages(data.data.pagination.totalPages || 1);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load tasks");
        } finally {
            setIsLoading(false);
        }
    };

    // Reset pagination page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, priorityFilter, projectFilter, timeFilter, limit]);

    // Re-fetch tasks when dependencies update
    useEffect(() => {
        fetchTasks();
    }, [debouncedSearch, statusFilter, priorityFilter, projectFilter, timeFilter, sortBy, sortOrder, page, limit, lastUpdated]);

    // Grouping logic for rendering the paginated task list
    const groups = useMemo(() => {
        const localGroups = {
            OVERDUE: [],
            "DUE TODAY": [],
            "DUE TOMORROW": [],
            "THIS WEEK": [],
            LATER: []
        };

        tasks.forEach((task) => {
            if (task.isOverdue) {
                localGroups.OVERDUE.push(task);
                return;
            }
            if (!task.dueDate) {
                localGroups.LATER.push(task);
                return;
            }

            const due = new Date(task.dueDate);
            const todayMidnight = new Date();
            todayMidnight.setHours(0, 0, 0, 0);

            const tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);
            const dayAfterTomorrowMidnight = new Date(todayMidnight.getTime() + 2 * 24 * 60 * 60 * 1000);
            const sevenDaysMidnight = new Date(todayMidnight.getTime() + 7 * 24 * 60 * 60 * 1000);

            if (due < todayMidnight) {
                localGroups.OVERDUE.push(task);
            } else if (due >= todayMidnight && due < tomorrowMidnight) {
                localGroups["DUE TODAY"].push(task);
            } else if (due >= tomorrowMidnight && due < dayAfterTomorrowMidnight) {
                localGroups["DUE TOMORROW"].push(task);
            } else if (due >= dayAfterTomorrowMidnight && due < sevenDaysMidnight) {
                localGroups["THIS WEEK"].push(task);
            } else {
                localGroups.LATER.push(task);
            }
        });

        return localGroups;
    }, [tasks]);

    const groupConfigs = {
        OVERDUE: {
            title: "Overdue",
            className: "border-red-100 bg-red-50/20 text-red-800",
            iconColor: "text-red-500",
            badgeClass: "bg-red-100 text-red-800"
        },
        "DUE TODAY": {
            title: "Due Today",
            className: "border-amber-100 bg-amber-50/20 text-amber-800",
            iconColor: "text-amber-500",
            badgeClass: "bg-amber-100 text-amber-800"
        },
        "DUE TOMORROW": {
            title: "Due Tomorrow",
            className: "border-yellow-100 bg-yellow-50/10 text-yellow-800",
            iconColor: "text-yellow-500",
            badgeClass: "bg-yellow-100 text-yellow-800"
        },
        "THIS WEEK": {
            title: "Due This Week",
            className: "border-blue-100 bg-blue-50/20 text-blue-800",
            iconColor: "text-blue-500",
            badgeClass: "bg-blue-100 text-blue-850"
        },
        LATER: {
            title: "Later Deadlines",
            className: "border-surface-150 bg-surface-50 text-surface-700",
            iconColor: "text-surface-400",
            badgeClass: "bg-surface-200 text-surface-700"
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header section with count */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-primary-600 flex items-center gap-1.5">
                        <HiOutlineQueueList className="w-4 h-4" /> Work Management
                    </p>
                    <h1 className="text-2xl font-bold text-surface-900 mt-1">My Tasks Dashboard</h1>
                    <p className="text-sm text-surface-500 mt-1">
                        Track upcoming milestones, manage schedules, and review late deliverables.
                    </p>
                </div>
                <div className="bg-white border border-surface-200 rounded-2xl px-5 py-3.5 shadow-sm text-center sm:text-right min-w-[140px] flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Filtered Tasks Count</span>
                    <span className="text-2xl font-black text-primary-700 leading-none">{totalCount}</span>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="bg-white border border-surface-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-surface-100 pb-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-surface-800">
                        <HiOutlineFunnel className="w-4.5 h-4.5 text-primary-600" />
                        <span>Quick Filters</span>
                    </div>
                    {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all" || timeFilter !== "all") && (
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("all");
                                setPriorityFilter("all");
                                setProjectFilter("all");
                                setTimeFilter("all");
                            }}
                            className="text-xs text-primary-650 hover:text-primary-800 font-bold transition cursor-pointer"
                        >
                            Reset All Filters
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
                            <HiOutlineMagnifyingGlass className="w-5 h-5" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search milestones..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-surface-55 border border-surface-200 rounded-xl text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Status filter */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-surface-55 border border-surface-200 rounded-xl text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer font-medium"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="submitted">Submitted Awaiting Review</option>
                            <option value="approved">Approved (Completed)</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>

                    {/* Priority filter */}
                    <div>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-surface-55 border border-surface-200 rounded-xl text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer font-medium"
                        >
                            <option value="all">All Priorities</option>
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                            <option value="urgent">Urgent Priority</option>
                        </select>
                    </div>

                    {/* Project filter */}
                    <div>
                        <select
                            value={projectFilter}
                            onChange={(e) => setProjectFilter(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-surface-55 border border-surface-200 rounded-xl text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer font-medium"
                        >
                            <option value="all">All Projects</option>
                            {projects.map((p) => (
                                <option key={p._id} value={p._id}>
                                    {p.title || p.gig?.title || "Unnamed Project"}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Time filter */}
                    <div>
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-surface-55 border border-surface-200 rounded-xl text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer font-medium"
                        >
                            <option value="all">All Timelines</option>
                            <option value="overdue">Overdue Tasks</option>
                            <option value="due-today">Due Today</option>
                            <option value="this-week">Due Within 7 Days</option>
                        </select>
                    </div>
                </div>

                {/* Sorting and limits configuration row */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3.5 border-t border-surface-100 text-xs">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-surface-500">Sort By:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-2.5 py-1.5 bg-surface-50 border border-surface-200 rounded-lg text-surface-700 cursor-pointer focus:outline-none font-medium"
                        >
                            <option value="dueDate">Due Date</option>
                            <option value="amount">Budget/Amount</option>
                            <option value="title">Title</option>
                            <option value="newest">Newest Created</option>
                            <option value="oldest">Oldest Created</option>
                            <option value="status">Status</option>
                            <option value="priority">Priority</option>
                        </select>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="px-2.5 py-1.5 bg-surface-50 border border-surface-200 rounded-lg text-surface-700 cursor-pointer focus:outline-none font-medium"
                        >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-surface-500">Show:</span>
                        <select
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="px-2 py-1.5 bg-surface-50 border border-surface-200 rounded-lg text-surface-700 cursor-pointer focus:outline-none font-medium"
                        >
                            <option value={10}>10 per page</option>
                            <option value={25}>25 per page</option>
                            <option value={50}>50 per page</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-150 rounded-xl text-sm text-danger font-medium">
                    {error}
                </div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div className="flex justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && totalCount === 0 && (
                <div className="bg-white border border-surface-200 rounded-3xl py-20 px-6 text-center shadow-sm max-w-2xl mx-auto">
                    <div className="h-16 w-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary-100">
                        <HiOutlineQueueList className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-extrabold text-surface-900">No Upcoming Tasks</h2>
                    <p className="text-sm text-surface-500 mt-2.5 max-w-sm mx-auto font-medium">
                        You're all caught up. No tasks match your current filter preferences.
                    </p>
                    {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all" || timeFilter !== "all") && (
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("all");
                                setPriorityFilter("all");
                                setProjectFilter("all");
                                setTimeFilter("all");
                            }}
                            className="mt-6 px-5 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold text-sm rounded-xl transition duration-150 border border-primary-200 cursor-pointer"
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>
            )}

            {/* Groups list */}
            {!isLoading && !error && totalCount > 0 && (
                <div className="space-y-8">
                    {Object.keys(groups).map((groupKey) => {
                        const items = groups[groupKey];
                        if (items.length === 0) return null;

                        const config = groupConfigs[groupKey];

                        return (
                            <section key={groupKey} className="space-y-3">
                                {/* Group Title header */}
                                <div className={`flex items-center gap-3 px-4 py-2 border rounded-xl font-bold text-sm ${config.className}`}>
                                    <HiOutlineClock className={`w-4.5 h-4.5 ${config.iconColor}`} />
                                    <span>{config.title}</span>
                                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-black ${config.badgeClass}`}>
                                        {items.length}
                                    </span>
                                </div>

                                {/* Task Cards list */}
                                <div className="grid grid-cols-1 gap-4">
                                    {items.map((task) => {
                                        const formattedBudget = Number(task.milestoneAmount || 0).toLocaleString();
                                        const isOverdue = task.isOverdue;

                                        return (
                                            <div
                                                key={task.milestoneId}
                                                className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                                    isOverdue ? "border-red-200 hover:border-red-300 bg-red-50/5" : "border-surface-200 hover:border-surface-300"
                                                }`}
                                            >
                                                {/* Left Info Column */}
                                                <div className="space-y-2.5 flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="font-extrabold text-surface-955 text-base leading-snug truncate">
                                                            {task.milestoneTitle || task.title}
                                                        </h4>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                            task.priority === "urgent" ? "bg-red-100 text-red-800 border border-red-200" :
                                                            task.priority === "high" ? "bg-orange-100 text-orange-850 border border-orange-200 animate-pulse" :
                                                            task.priority === "medium" ? "bg-blue-105 bg-blue-100 text-blue-800 border border-blue-200" :
                                                            "bg-surface-100 text-surface-600 border border-surface-200"
                                                        }`}>
                                                            {task.priority || "medium"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-surface-400 font-medium mt-1 truncate">
                                                        Project: <span className="text-surface-700 font-semibold">{task.projectTitle || task.project?.title}</span>
                                                    </p>
                                                </div>

                                                {/* Badges & time details */}
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs md:mr-4">
                                                    <MilestoneStatusBadge status={task.status} />

                                                    <span className="text-surface-950 font-bold text-sm">
                                                        Budget: ${formattedBudget}
                                                    </span>

                                                    {task.dueDate ? (
                                                        <span className="flex items-center gap-1 text-surface-550 font-semibold">
                                                            <HiOutlineCalendarDays className="w-4 h-4 text-surface-400" />
                                                            Due: {new Date(task.dueDate).toLocaleDateString(undefined, {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric"
                                                            })}{" "}
                                                            {new Date(task.dueDate).toLocaleTimeString(undefined, {
                                                                hour: "2-digit",
                                                                minute: "2-digit"
                                                            })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-surface-400">No deadline</span>
                                                    )}

                                                    {task.dueDate && (
                                                        <span className={`font-bold ${isOverdue ? "text-red-750" : "text-primary-700"}`}>
                                                            ({formatTimeRemaining(task.timeRemaining, isOverdue, task.dueDate)})
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Action Button */}
                                                <div className="flex-shrink-0 self-end md:self-center">
                                                    <Link
                                                        to={`/dashboard/my-projects/${task.projectId || task.project?._id}`}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-50 hover:bg-primary-50 text-surface-700 hover:text-primary-750 font-semibold border border-surface-200 hover:border-primary-200 rounded-xl transition text-sm cursor-pointer"
                                                    >
                                                        <HiOutlineFolderOpen className="w-4.5 h-4.5" />
                                                        <span>Open Project</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-surface-100 pt-6 mt-6">
                            <button
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className="px-4 py-2 text-sm font-semibold border border-surface-200 rounded-xl hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                            >
                                Previous
                            </button>
                            <span className="text-sm font-medium text-surface-600">
                                Page {page} of {totalPages} ({totalCount} total tasks)
                            </span>
                            <button
                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages}
                                className="px-4 py-2 text-sm font-semibold border border-surface-200 rounded-xl hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
