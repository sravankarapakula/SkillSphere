import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    HiOutlineDocumentCheck,
    HiOutlinePencilSquare,
    HiOutlineTrash,
    HiOutlinePlusCircle,
    HiOutlineLockClosed,
    HiOutlineCalendarDays
} from "react-icons/hi2";
import {
    fetchProjectMilestones,
    createNewMilestone,
    editMilestone,
    removeMilestone,
    changeMilestoneStatus,
    resetMilestoneState
} from "../../redux/slices/milestoneSlice";
import MilestoneStatusBadge from "./MilestoneStatusBadge";
import MilestoneFormModal from "./MilestoneFormModal";
import LoadingSpinner from "../shared/LoadingSpinner";
import Button from "../shared/Button";

const formatLateness = (ms) => {
    if (!ms || ms <= 0) return "";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const remainingHours = hours % 24;
    
    if (days > 0) {
        return `Late by: ${days} day${days > 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
    }
    return `Late by: ${hours} hour${hours > 1 ? 's' : ''}`;
};

export default function MilestonePanel({
    projectId,
    isClient,
    projectStatus,
    agreedAmount
}) {
    const dispatch = useDispatch();
    const { milestones, budgetInfo, isLoading, isError, message } = useSelector((state) => state.milestone);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState(null);
    const [actionError, setActionError] = useState("");

    useEffect(() => {
        dispatch(fetchProjectMilestones(projectId));
        return () => {
            dispatch(resetMilestoneState());
        };
    }, [projectId, dispatch]);

    // Clear action error after 5 seconds
    useEffect(() => {
        if (actionError) {
            const timer = setTimeout(() => setActionError(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [actionError]);

    // Count statistics
    const totalCount = milestones.length;
    const pendingCount = milestones.filter((m) => m.status === "pending").length;
    const inProgressCount = milestones.filter((m) => m.status === "in_progress").length;
    const overdueCount = milestones.filter((m) => m.status === "overdue").length;
    const submittedCount = milestones.filter((m) => m.status === "submitted").length;
    const approvedCount = milestones.filter((m) => m.status === "approved").length;

    const isProjectActive = !["completed", "cancelled"].includes(projectStatus);

    const handleOpenCreateModal = () => {
        setEditingMilestone(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (milestone) => {
        setEditingMilestone(milestone);
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (formData) => {
        setActionError("");
        try {
            if (editingMilestone) {
                const result = await dispatch(editMilestone({ id: editingMilestone._id, data: formData })).unwrap();
                if (result.success) {
                    setIsModalOpen(false);
                }
            } else {
                const result = await dispatch(createNewMilestone({ ...formData, projectId })).unwrap();
                if (result.success) {
                    setIsModalOpen(false);
                }
            }
        } catch (err) {
            setActionError(err || "Failed to save milestone");
        }
    };

    const handleDelete = async (milestoneId) => {
        if (window.confirm("Are you sure you want to delete this milestone?")) {
            setActionError("");
            try {
                await dispatch(removeMilestone(milestoneId)).unwrap();
            } catch (err) {
                setActionError(err || "Failed to delete milestone");
            }
        }
    };

    const handleStatusUpdate = async (milestoneId, nextStatus) => {
        setActionError("");
        try {
            await dispatch(changeMilestoneStatus({ id: milestoneId, status: nextStatus })).unwrap();
        } catch (err) {
            setActionError(err || "Failed to update milestone status");
        }
    };

    if (isLoading && milestones.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-surface-200 rounded-2xl shadow-sm">
                <LoadingSpinner />
                <p className="mt-4 text-surface-500 font-medium">Loading milestones...</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-surface-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-surface-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary-50 rounded-xl text-primary-600">
                        <HiOutlineDocumentCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-surface-900">Contract Milestones</h2>
                        <p className="text-sm text-surface-500 font-medium">Total Contract Value: ${agreedAmount}</p>
                    </div>
                </div>

                {isClient && isProjectActive && (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleOpenCreateModal}
                        className="rounded-xl flex items-center gap-1.5"
                    >
                        <HiOutlinePlusCircle className="w-5 h-5" />
                        Add Milestone
                    </Button>
                )}
            </div>

            {/* Error Message */}
            {(isError || actionError) && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-150 rounded-xl text-sm text-danger font-medium flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{actionError || message}</span>
                </div>
            )}

            {/* Summary Bar */}
            {totalCount > 0 && (
                <div className="px-6 py-4 bg-surface-50/50 border-b border-surface-100 grid grid-cols-3 sm:grid-cols-6 gap-4">
                    <div className="text-center sm:text-left">
                        <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider">Total</p>
                        <p className="text-lg font-bold text-surface-900">{totalCount}</p>
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Pending</p>
                        <p className="text-lg font-bold text-amber-700">{pendingCount}</p>
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">In Progress</p>
                        <p className="text-lg font-bold text-blue-700">{inProgressCount}</p>
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-xs text-red-650 font-semibold uppercase tracking-wider">Overdue</p>
                        <p className="text-lg font-bold text-red-700">{overdueCount}</p>
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-xs text-violet-600 font-semibold uppercase tracking-wider">Submitted</p>
                        <p className="text-lg font-bold text-violet-700">{submittedCount}</p>
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Approved</p>
                        <p className="text-lg font-bold text-emerald-700">{approvedCount}</p>
                    </div>
                </div>
            )}

            {/* Milestones List */}
            <div className="p-6">
                {totalCount === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-surface-50 border border-surface-100 rounded-full flex items-center justify-center text-surface-400 mb-4">
                            <HiOutlineDocumentCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-bold text-surface-800 mb-1">No milestones created yet</h3>
                        <p className="text-sm text-surface-500 max-w-sm mb-6">
                            Milestones allow you to break down the contract budget and track progress dynamically.
                        </p>
                        {isClient && isProjectActive && (
                            <Button
                                variant="primary"
                                onClick={handleOpenCreateModal}
                                className="rounded-xl"
                            >
                                Create First Milestone
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {milestones.map((milestone) => {
                            const isApproved = milestone.status === "approved";
                            const isInProgress = milestone.status === "in_progress";
                            const isSubmitted = milestone.status === "submitted";
                            const isPending = milestone.status === "pending";
                            const isOverdueState = milestone.status === "overdue" || milestone.isOverdue;

                            let cardClass = "border-surface-200 hover:border-surface-300";
                            if (isOverdueState) cardClass = "bg-red-50/10 border-red-300 hover:border-red-400";
                            else if (isApproved) cardClass = "bg-emerald-50/20 border-emerald-100";
                            else if (isInProgress) cardClass = "bg-blue-50/20 border-blue-100";
                            else if (isSubmitted) cardClass = "bg-violet-50/20 border-violet-100";

                            let warningText = "";
                            let warningType = "";
                            if (isOverdueState) {
                                warningType = "overdue";
                                warningText = "Overdue";
                            } else if (milestone.isUrgent) {
                                warningType = "urgent";
                                const hours = Math.ceil(milestone.timeRemaining / (60 * 60 * 1000));
                                warningText = `Urgent: Due in ${hours}h`;
                            } else if (milestone.isDueSoon) {
                                warningType = "due_soon";
                                const hours = Math.ceil(milestone.timeRemaining / (60 * 60 * 1000));
                                warningText = `Due in ${hours}h`;
                            }

                            return (
                                <div
                                    key={milestone._id}
                                    className={`p-5 rounded-2xl border transition-all duration-200 ${cardClass} flex flex-col md:flex-row md:items-center md:justify-between gap-4`}
                                >
                                    {/* Left Side Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                                            {isApproved && (
                                                <div className="p-1 bg-emerald-100 rounded-md text-emerald-600">
                                                    <HiOutlineLockClosed className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                            <h4 className="text-base font-bold text-surface-950 truncate">
                                                {milestone.title}
                                            </h4>
                                            <MilestoneStatusBadge status={milestone.status} />
                                            {warningText && (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                                                    warningType === "overdue" ? "bg-red-100 text-red-800 border-red-200" :
                                                    warningType === "urgent" ? "bg-red-50 text-red-700 border-red-150 animate-pulse" :
                                                    "bg-orange-50 text-orange-700 border-orange-200"
                                                }`}>
                                                    {warningText}
                                                </span>
                                            )}
                                        </div>

                                        {milestone.description && (
                                            <p className="text-sm text-surface-600 mb-3 line-clamp-2 pr-4 font-medium">
                                                {milestone.description}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-surface-600 font-semibold">
                                            <span className="text-surface-950 font-bold text-sm">
                                                Budget: ${milestone.amount}
                                            </span>
                                            {milestone.dueDate ? (
                                                <span className="flex items-center gap-1">
                                                    <HiOutlineCalendarDays className="w-4 h-4 text-surface-500" />
                                                    Due: {new Date(milestone.dueDate).toLocaleDateString(undefined, {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric"
                                                    })}{" "}
                                                    {new Date(milestone.dueDate).toLocaleTimeString(undefined, {
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-surface-450">
                                                    <HiOutlineCalendarDays className="w-4 h-4" />
                                                    No deadline
                                                </span>
                                            )}
                                            {milestone.submittedAt && (
                                                <span className="text-violet-600 font-semibold flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                    Submitted: {new Date(milestone.submittedAt).toLocaleDateString(undefined, {
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </span>
                                            )}
                                            {milestone.lateness > 0 && (
                                                <span className="text-red-650 font-semibold flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {formatLateness(milestone.lateness)}
                                                </span>
                                            )}
                                            {milestone.approvedAt && (
                                                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Approved: {new Date(milestone.approvedAt).toLocaleDateString(undefined, {
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side Actions */}
                                    <div className="flex items-center justify-end gap-2.5 flex-shrink-0 self-end md:self-center">
                                        {/* Client Actions */}
                                        {isClient && isProjectActive && (
                                            <>
                                                {isPending && (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenEditModal(milestone)}
                                                            className="p-2 text-surface-500 hover:text-primary-600 hover:bg-surface-50 border border-surface-200 hover:border-primary-200 rounded-xl transition-all cursor-pointer"
                                                            title="Edit Milestone"
                                                        >
                                                            <HiOutlinePencilSquare className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(milestone._id)}
                                                            className="p-2 text-surface-500 hover:text-danger hover:bg-red-50 border border-surface-200 hover:border-red-200 rounded-xl transition-all cursor-pointer"
                                                            title="Delete Milestone"
                                                        >
                                                            <HiOutlineTrash className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {isSubmitted && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(milestone._id, "approved")}
                                                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                                                    >
                                                        Approve Work
                                                    </Button>
                                                )}
                                            </>
                                        )}

                                        {/* Freelancer Actions */}
                                        {!isClient && isProjectActive && (
                                            <>
                                                {(isPending || milestone.status === "overdue") && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(milestone._id, "in_progress")}
                                                        className="rounded-xl text-xs"
                                                    >
                                                        Start Work
                                                    </Button>
                                                )}
                                                {(isInProgress || milestone.status === "overdue") && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(milestone._id, "submitted")}
                                                        className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs"
                                                    >
                                                        Submit Deliverables
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            <MilestoneFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                milestone={editingMilestone}
                isLoading={isLoading}
                remainingBudget={budgetInfo.remainingBudget}
                totalBudget={budgetInfo.totalBudget}
            />
        </div>
    );
}
