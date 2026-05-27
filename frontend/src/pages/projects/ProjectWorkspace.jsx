import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineClock, HiOutlineDocumentCheck } from "react-icons/hi2";
import { fetchProjectById, updateProjectDetails, resetProjectState } from "../../redux/slices/projectSlice";
import { setActiveConversation } from "../../redux/slices/messageSlice";
import StatusBadge from "../../components/proposals/StatusBadge";
import ChatWindow from "../../components/chat/ChatWindow";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Button from "../../components/shared/Button";

export default function ProjectWorkspace() {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { onlineUsers } = useSelector((state) => state.message);
    const { currentProject, currentConversation, isLoading, error, isSuccess } = useSelector((state) => state.project);

    const [progress, setProgress] = useState(0);
    const [updating, setUpdating] = useState(false);
    const [actionError, setActionError] = useState("");

    useEffect(() => {
        dispatch(fetchProjectById(projectId));
        return () => {
            dispatch(resetProjectState());
        };
    }, [dispatch, projectId]);

    useEffect(() => {
        if (currentProject) {
            setProgress(currentProject.progressPercentage || 0);
        }
        if (currentConversation) {
            dispatch(setActiveConversation(currentConversation._id));
        }
    }, [currentProject, currentConversation, dispatch]);

    if (isLoading && !currentProject) {
        return <LoadingSpinner size="lg" className="py-20" />;
    }

    if (error && !currentProject) {
        return (
            <div className="space-y-4 max-w-xl mx-auto py-10 text-center">
                <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
                <Link to="/dashboard/my-projects" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                    Back to My Projects
                </Link>
            </div>
        );
    }

    if (!currentProject) return null;

    const isClient = user?.role === "client";
    const partner = isClient ? currentProject.freelancer : currentProject.client;
    const projectStatus = currentProject.status;
    const milestones = currentProject.milestones || [];
    const agreedAmount = currentProject.agreedAmount || 0;

    // Handle progress percentage slider save (Freelancer/Client)
    const handleSaveProgress = async () => {
        try {
            setUpdating(true);
            setActionError("");
            await dispatch(updateProjectDetails({
                projectId,
                updateData: { progressPercentage: progress }
            })).unwrap();
        } catch (err) {
            setActionError(err || "Could not update progress.");
        } finally {
            setUpdating(false);
        }
    };

    // Handle complete milestone checkbox toggle (Client only)
    const handleMilestoneToggle = async (index, currentStatus) => {
        if (!isClient) return;

        try {
            setUpdating(true);
            setActionError("");
            const updatedMilestones = milestones.map((m, idx) =>
                idx === index ? { ...m, status: currentStatus === "completed" ? "pending" : "completed" } : m
            );

            await dispatch(updateProjectDetails({
                projectId,
                updateData: { milestones: updatedMilestones }
            })).unwrap();
        } catch (err) {
            setActionError(err || "Could not update milestones.");
        } finally {
            setUpdating(false);
        }
    };

    // Handle complete project (Client only)
    const handleCompleteProject = async () => {
        try {
            setUpdating(true);
            setActionError("");
            await dispatch(updateProjectDetails({
                projectId,
                updateData: { status: "completed" }
            })).unwrap();
        } catch (err) {
            setActionError(err || "Could not complete project.");
        } finally {
            setUpdating(false);
        }
    };

    // Handle pause/active project (Client only)
    const handleStatusTransition = async (newStatus) => {
        try {
            setUpdating(true);
            setActionError("");
            await dispatch(updateProjectDetails({
                projectId,
                updateData: { status: newStatus }
            })).unwrap();
        } catch (err) {
            setActionError(err || `Could not update project to ${newStatus}.`);
        } finally {
            setUpdating(false);
        }
    };

    const formattedDeadline = currentProject.expectedCompletionDate
        ? new Date(currentProject.expectedCompletionDate).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric"
          })
        : "Not set";

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto h-[calc(100vh-140px)] min-h-[500px] flex flex-col">
            {/* Header section */}
            <div className="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
                <div className="min-w-0">
                    <Link
                        to="/dashboard/my-projects"
                        className="inline-flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-primary-700 mb-2"
                    >
                        <HiOutlineArrowLeft className="h-4 w-4" />
                        Back to projects
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl md:text-2xl font-bold text-surface-900 truncate">
                            {currentProject.gig?.title || "Contract Execution Workspace"}
                        </h1>
                        <StatusBadge status={projectStatus} />
                    </div>
                </div>

                {isClient && projectStatus !== "completed" && projectStatus !== "cancelled" && (
                    <div className="flex gap-2 flex-wrap">
                        {projectStatus === "paused" ? (
                            <Button
                                size="sm"
                                variant="secondary"
                                isLoading={updating}
                                onClick={() => handleStatusTransition("in_progress")}
                            >
                                Resume Project
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                isLoading={updating}
                                onClick={() => handleStatusTransition("paused")}
                            >
                                Pause Project
                            </Button>
                        )}
                        <Button
                            size="sm"
                            isLoading={updating}
                            onClick={handleCompleteProject}
                        >
                            Complete Project
                        </Button>
                    </div>
                )}
            </div>

            {actionError && (
                <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-700 flex-shrink-0">
                    {actionError}
                </p>
            )}

            {/* Split Screen Panel */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 overflow-hidden h-full">
                {/* Left Panel: Project Details & Milestones */}
                <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm overflow-y-auto space-y-6 scrollbar-thin">
                    {/* Project Overview details */}
                    <div>
                        <h2 className="text-base font-bold text-surface-900 border-b border-surface-100 pb-2 mb-3">
                            Project Details
                        </h2>
                        <p className="text-sm text-surface-600 leading-relaxed whitespace-pre-wrap">
                            {currentProject.gig?.description || "No contract description available."}
                        </p>
                    </div>

                    {/* Progress Slider */}
                    <div className="bg-surface-50 border border-surface-100 rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold text-surface-900 flex items-center justify-between">
                            <span>Project Progress</span>
                            <span className="text-primary-700 font-semibold text-base">{progress}%</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="h-2.5 w-full bg-surface-150 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {/* Slider: only editable if freelancer or client chooses to update manually */}
                            {(!isClient && ["active", "in_progress", "revision"].includes(projectStatus)) ? (
                                <div className="flex items-center gap-4 pt-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={progress}
                                        onChange={(e) => setProgress(Number(e.target.value))}
                                        className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    />
                                    <button
                                        onClick={handleSaveProgress}
                                        disabled={updating || progress === currentProject.progressPercentage}
                                        className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-55 text-white font-bold text-xs rounded-xl shadow transition flex-shrink-0 cursor-pointer"
                                    >
                                        Update Progress
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Partner and Dates Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {partner && (
                            <div className="border border-surface-150 rounded-2xl p-4 flex items-center gap-3">
                                {partner.profileImage ? (
                                    <img
                                        src={partner.profileImage}
                                        alt={partner.name}
                                        className="h-11 w-11 rounded-full object-cover border border-surface-200 flex-shrink-0"
                                    />
                                ) : (
                                    <div className="h-11 w-11 bg-primary-100 text-primary-700 font-bold rounded-full flex items-center justify-center text-sm border border-primary-200 flex-shrink-0">
                                        {partner.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <span className="text-[10px] text-surface-400 font-bold uppercase tracking-wider">
                                        {isClient ? "Freelancer partner" : "Client partner"}
                                    </span>
                                    <h4 className="text-sm font-bold text-surface-800 truncate">
                                        {partner.name}
                                    </h4>
                                    <p className="text-xs text-surface-500 truncate">{partner.email}</p>
                                </div>
                            </div>
                        )}

                        <div className="border border-surface-150 rounded-2xl p-4 flex items-center gap-3">
                            <div className="h-10 w-10 bg-accent-50 text-accent-700 border border-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <HiOutlineClock className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] text-surface-400 font-bold uppercase tracking-wider">
                                    Deadline Target
                                </span>
                                <h4 className="text-sm font-bold text-surface-800">{formattedDeadline}</h4>
                                <p className="text-xs text-surface-500">Agreed: {currentProject.estimatedDays} days</p>
                            </div>
                        </div>
                    </div>

                    {/* Milestones Panel */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2 flex items-center gap-2">
                            <HiOutlineDocumentCheck className="h-5 w-5 text-primary-500" />
                            Contract Milestones (${Number(agreedAmount).toLocaleString()})
                        </h3>

                        <div className="space-y-3">
                            {milestones.map((milestone, idx) => {
                                const isCompleted = milestone.status === "completed";
                                return (
                                    <div
                                        key={milestone._id || idx}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition ${
                                            isCompleted
                                                ? "bg-emerald-50/40 border-emerald-100"
                                                : "bg-white border-surface-200"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isClient && ["active", "in_progress", "revision"].includes(projectStatus) ? (
                                                <input
                                                    type="checkbox"
                                                    checked={isCompleted}
                                                    disabled={updating}
                                                    onChange={() => handleMilestoneToggle(idx, milestone.status)}
                                                    className="w-4 h-4 text-primary-600 border-surface-300 rounded focus:ring-primary-500 accent-primary-600 cursor-pointer disabled:opacity-50"
                                                />
                                            ) : (
                                                <HiOutlineCheckCircle
                                                    className={`h-5 w-5 ${
                                                        isCompleted ? "text-emerald-600" : "text-surface-300"
                                                    }`}
                                                />
                                            )}
                                            <div>
                                                <p className={`text-sm font-semibold ${isCompleted ? "text-surface-500 line-through" : "text-surface-800"}`}>
                                                    {milestone.title}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-surface-800 bg-surface-100 border border-surface-200 px-2.5 py-1 rounded-lg">
                                            ${Number(milestone.amount).toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Linked Chat Module */}
                <div className="bg-white border border-surface-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
                    {currentConversation ? (
                        <ChatWindow
                            conversation={currentConversation}
                            currentUser={user}
                            onlineUsers={onlineUsers}
                            onBack={() => {}}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <LoadingSpinner size="md" className="mb-4" />
                            <h4 className="text-sm font-semibold text-surface-800 mb-1">Loading Chat...</h4>
                            <p className="text-xs text-surface-400 max-w-[200px]">
                                Preparing the secure discussion room.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
