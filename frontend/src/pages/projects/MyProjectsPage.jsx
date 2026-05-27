import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { HiOutlineFolderOpen, HiOutlineBriefcase, HiOutlineUser, HiOutlineClock } from "react-icons/hi2";
import { fetchUserProjects } from "../../redux/slices/projectSlice";
import StatusBadge from "../../components/proposals/StatusBadge";
import LoadingSpinner from "../../components/shared/LoadingSpinner";

export default function MyProjectsPage() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { projects, isLoading, error } = useSelector((state) => state.project);

    useEffect(() => {
        dispatch(fetchUserProjects());
    }, [dispatch]);

    const isClient = user?.role === "client";

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <p className="text-sm font-medium text-primary-600">Active Workspace</p>
                <h1 className="text-2xl font-bold text-surface-900 mt-1">
                    {isClient ? "Managed Projects" : "My Projects"}
                </h1>
                <p className="text-sm text-surface-500 mt-1">
                    View active contracts, track milestones, and converse with your partner.
                </p>
            </div>

            {isLoading && <LoadingSpinner size="lg" className="py-20" />}

            {error && (
                <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {!isLoading && !error && projects.length === 0 && (
                <div className="bg-white border border-surface-200 rounded-2xl py-20 px-6 text-center shadow-sm">
                    <div className="h-16 w-16 bg-surface-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-surface-100">
                        <HiOutlineFolderOpen className="h-8 w-8 text-surface-400" />
                    </div>
                    <h2 className="text-lg font-bold text-surface-900">No projects yet</h2>
                    <p className="text-sm text-surface-500 mt-2 max-w-sm mx-auto">
                        {isClient
                            ? "Accept a freelancer's proposal to automatically create a workspace and start executing."
                            : "Submit bids on open gigs. Once a client hires you, your project workspace will appear here."}
                    </p>
                    {isClient ? (
                        <Link
                            to="/dashboard/browse"
                            className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition"
                        >
                            Browse Talent
                        </Link>
                    ) : (
                        <Link
                            to="/dashboard/projects"
                            className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition"
                        >
                            Find Gigs
                        </Link>
                    )}
                </div>
            )}

            {!isLoading && !error && projects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map((project) => {
                        const partner = isClient ? project.freelancer : project.client;
                        const agreedAmount = project.agreedAmount || 0;
                        const progress = project.progressPercentage || 0;
                        const formattedBudget = Number(agreedAmount).toLocaleString();

                        return (
                            <article
                                key={project._id}
                                className="bg-white border border-surface-200 hover:border-primary-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    {/* Top Line: Gig Title and Status */}
                                    <div className="flex justify-between items-start gap-4">
                                        <h3 className="font-bold text-surface-900 text-lg leading-snug">
                                            {project.gig?.title || "Contract Execution Workspace"}
                                        </h3>
                                        <StatusBadge status={project.status} />
                                    </div>

                                    {/* Partner details */}
                                    {partner && (
                                        <div className="flex items-center gap-3 bg-surface-50 p-3 rounded-xl border border-surface-100">
                                            {partner.profileImage ? (
                                                <img
                                                    src={partner.profileImage}
                                                    alt={partner.name}
                                                    className="h-9 w-9 rounded-full object-cover border border-surface-200"
                                                />
                                            ) : (
                                                <div className="h-9 w-9 bg-primary-100 text-primary-700 font-bold rounded-full flex items-center justify-center text-xs border border-primary-200">
                                                    {partner.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs text-surface-400 font-medium">
                                                    {isClient ? "Hired Freelancer" : "Client Partner"}
                                                </p>
                                                <p className="text-sm font-semibold text-surface-800 truncate">
                                                    {partner.name}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress section */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-surface-500">Progress</span>
                                            <span className="text-primary-700">{progress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Contract Details */}
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-surface-600 pt-1">
                                        <span className="flex items-center gap-1.5">
                                            <HiOutlineBriefcase className="h-4 w-4 text-surface-400" />
                                            Budget: <strong className="text-surface-900">${formattedBudget}</strong>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <HiOutlineClock className="h-4 w-4 text-surface-400" />
                                            Duration: <strong className="text-surface-900">{project.estimatedDays} days</strong>
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-surface-100">
                                    <Link
                                        to={`/dashboard/my-projects/${project._id}`}
                                        className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition duration-150 text-sm"
                                    >
                                        Enter Project Workspace
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
