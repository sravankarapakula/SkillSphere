import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchDeliverables,
    reviewExistingDeliverable,
    resetDeliverableState,
    clearDeliverableError
} from "../../redux/slices/deliverableSlice";
import DeliverableFilePreview from "./DeliverableFilePreview";
import Button from "../shared/Button";
import LoadingSpinner from "../shared/LoadingSpinner";
import {
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineXMark,
    HiOutlineClock,
    HiOutlineUser,
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineArrowPath
} from "react-icons/hi2";

const STATUS_BADGE = {
    submitted: { label: "Pending Review", className: "bg-violet-50 text-violet-700 border-violet-200" },
    approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { label: "Rejected", className: "bg-orange-50 text-orange-700 border-orange-200" }
};

export default function DeliverableReviewPanel({
    isOpen,
    onClose,
    milestoneId,
    milestoneTitle = "",
    isClient = false,
    onReviewComplete
}) {
    const dispatch = useDispatch();
    const { deliverables, isLoading, isReviewing, isError, message } = useSelector(
        (state) => state.deliverable
    );

    const [selectedVersion, setSelectedVersion] = useState(null);
    const [reviewAction, setReviewAction] = useState(null); // "approve" | "reject"
    const [feedback, setFeedback] = useState("");
    const [reviewError, setReviewError] = useState("");

    useEffect(() => {
        if (isOpen && milestoneId) {
            dispatch(fetchDeliverables(milestoneId));
            dispatch(clearDeliverableError());
            setReviewAction(null);
            setFeedback("");
            setReviewError("");
        }
        return () => {
            if (!isOpen) {
                dispatch(resetDeliverableState());
            }
        };
    }, [isOpen, milestoneId, dispatch]);

    // Auto-select latest version
    useEffect(() => {
        if (deliverables.length > 0 && !selectedVersion) {
            setSelectedVersion(deliverables[0]);
        }
    }, [deliverables, selectedVersion]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && !isReviewing) {
                if (reviewAction) {
                    setReviewAction(null);
                } else {
                    onClose();
                }
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, isReviewing, reviewAction]);

    const handleReview = async () => {
        setReviewError("");

        if (reviewAction === "reject" && !feedback.trim()) {
            setReviewError("Feedback is required when rejecting deliverables");
            return;
        }

        if (!selectedVersion?._id) return;

        try {
            const result = await dispatch(
                reviewExistingDeliverable({
                    deliverableId: selectedVersion._id,
                    reviewData: { action: reviewAction, feedback: feedback.trim() }
                })
            ).unwrap();

            if (result.success) {
                onReviewComplete?.(result.data);
                setReviewAction(null);
                setFeedback("");
                // Refetch to get updated list
                dispatch(fetchDeliverables(milestoneId));
            }
        } catch (err) {
            setReviewError(err || "Failed to review deliverable");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={!isReviewing ? onClose : undefined} />

            <div className="relative w-full max-w-4xl bg-white border border-surface-200 shadow-2xl rounded-2xl z-10 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-surface-100">
                    <div>
                        <h3 className="text-xl font-bold text-surface-900">
                            {isClient ? "Review Deliverables" : "Submission Details"}
                        </h3>
                        {milestoneTitle && (
                            <p className="text-sm text-surface-500 font-medium mt-1">
                                Milestone: <span className="text-surface-700 font-semibold">{milestoneTitle}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={!isReviewing ? onClose : undefined}
                        className="text-surface-400 hover:text-surface-600 transition-colors p-1.5 hover:bg-surface-50 rounded-lg cursor-pointer"
                        aria-label="Close panel"
                        disabled={isReviewing}
                    >
                        <HiOutlineXMark className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12">
                            <LoadingSpinner />
                            <p className="mt-4 text-surface-500 font-medium">Loading deliverables...</p>
                        </div>
                    ) : deliverables.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-surface-50 border border-surface-100 rounded-full flex items-center justify-center text-surface-400 mb-4">
                                <HiOutlineChatBubbleBottomCenterText className="w-8 h-8" />
                            </div>
                            <h4 className="text-base font-bold text-surface-800 mb-1">No submissions yet</h4>
                            <p className="text-sm text-surface-500">Deliverables will appear here once submitted.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-surface-100">
                            {/* Version Sidebar */}
                            <div className="p-4 space-y-2 lg:max-h-[60vh] lg:overflow-y-auto">
                                <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3 px-2">
                                    Versions ({deliverables.length})
                                </h4>
                                {deliverables.map((d) => {
                                    const badge = STATUS_BADGE[d.status] || STATUS_BADGE.submitted;
                                    const isSelected = selectedVersion?._id === d._id;
                                    return (
                                        <button
                                            key={d._id}
                                            onClick={() => {
                                                setSelectedVersion(d);
                                                setReviewAction(null);
                                                setFeedback("");
                                                setReviewError("");
                                            }}
                                            className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                                                isSelected
                                                    ? "border-primary-300 bg-primary-50/50 shadow-sm"
                                                    : "border-surface-100 hover:border-surface-200 hover:bg-surface-50/50"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-bold text-surface-800">v{d.version}</span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-surface-400">
                                                {new Date(d.createdAt).toLocaleDateString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </p>
                                            <p className="text-[11px] text-surface-500 mt-0.5">
                                                {d.files?.length || 0} file{d.files?.length !== 1 ? "s" : ""}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Content Panel */}
                            <div className="p-6 lg:max-h-[60vh] lg:overflow-y-auto space-y-6">
                                {selectedVersion ? (
                                    <>
                                        {/* Version Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-lg font-bold text-surface-900">
                                                    Version {selectedVersion.version}
                                                </h4>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                                    (STATUS_BADGE[selectedVersion.status] || STATUS_BADGE.submitted).className
                                                }`}>
                                                    {(STATUS_BADGE[selectedVersion.status] || STATUS_BADGE.submitted).label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Submission Info */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-surface-500 font-medium">
                                            {selectedVersion.submittedBy && (
                                                <span className="flex items-center gap-1">
                                                    <HiOutlineUser className="w-3.5 h-3.5" />
                                                    {selectedVersion.submittedBy.name || "Freelancer"}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <HiOutlineClock className="w-3.5 h-3.5" />
                                                {new Date(selectedVersion.createdAt).toLocaleString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </span>
                                        </div>

                                        {/* Notes */}
                                        {selectedVersion.notes && (
                                            <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
                                                <h5 className="text-xs font-bold text-surface-600 uppercase tracking-wider mb-2">
                                                    Submission Notes
                                                </h5>
                                                <p className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed">
                                                    {selectedVersion.notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Files */}
                                        <div>
                                            <h5 className="text-xs font-bold text-surface-600 uppercase tracking-wider mb-3">
                                                Attached Files ({selectedVersion.files?.length || 0})
                                            </h5>
                                            <DeliverableFilePreview files={selectedVersion.files} />
                                        </div>

                                        {/* Review Feedback (if already reviewed) */}
                                        {selectedVersion.reviewFeedback && (
                                            <div className={`rounded-xl p-4 border ${
                                                selectedVersion.status === "approved"
                                                    ? "bg-emerald-50/50 border-emerald-100"
                                                    : "bg-orange-50/50 border-orange-100"
                                            }`}>
                                                <h5 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    {selectedVersion.status === "approved" ? (
                                                        <><HiOutlineCheckCircle className="w-4 h-4 text-emerald-600" /> <span className="text-emerald-700">Approval Feedback</span></>
                                                    ) : (
                                                        <><HiOutlineXCircle className="w-4 h-4 text-orange-600" /> <span className="text-orange-700">Rejection Feedback</span></>
                                                    )}
                                                </h5>
                                                <p className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed">
                                                    {selectedVersion.reviewFeedback}
                                                </p>
                                                {selectedVersion.reviewedBy && (
                                                    <p className="text-[11px] text-surface-400 mt-2">
                                                        By {selectedVersion.reviewedBy.name || "Client"} • {new Date(selectedVersion.reviewedAt).toLocaleString(undefined, {
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Review Actions (Client only, for submitted deliverables) */}
                                        {isClient && selectedVersion.status === "submitted" && (
                                            <div className="space-y-4 pt-4 border-t border-surface-100">
                                                {!reviewAction ? (
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => setReviewAction("approve")}
                                                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                                        >
                                                            <HiOutlineCheckCircle className="w-4 h-4" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => setReviewAction("reject")}
                                                            className="rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50 font-bold"
                                                        >
                                                            <HiOutlineArrowPath className="w-4 h-4" />
                                                            Request Revision
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className={`p-3 rounded-xl border ${
                                                            reviewAction === "approve"
                                                                ? "bg-emerald-50/50 border-emerald-100"
                                                                : "bg-orange-50/50 border-orange-100"
                                                        }`}>
                                                            <h5 className="text-sm font-bold mb-2">
                                                                {reviewAction === "approve" ? "✅ Approving this submission" : "🔄 Requesting revision"}
                                                            </h5>
                                                            <textarea
                                                                value={feedback}
                                                                onChange={(e) => setFeedback(e.target.value)}
                                                                placeholder={
                                                                    reviewAction === "approve"
                                                                        ? "Optional: Add approval notes..."
                                                                        : "Required: Explain what needs to be revised..."
                                                                }
                                                                rows="3"
                                                                maxLength={5000}
                                                                className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                                                            />
                                                        </div>

                                                        {(reviewError || isError) && (
                                                            <p className="text-sm text-danger font-medium">{reviewError || message}</p>
                                                        )}

                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setReviewAction(null);
                                                                    setFeedback("");
                                                                    setReviewError("");
                                                                }}
                                                                disabled={isReviewing}
                                                                className="rounded-xl"
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={handleReview}
                                                                isLoading={isReviewing}
                                                                className={`rounded-xl font-bold ${
                                                                    reviewAction === "approve"
                                                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                                                        : "bg-orange-600 hover:bg-orange-700"
                                                                } text-white`}
                                                            >
                                                                {reviewAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-surface-400 text-sm">
                                        Select a version to view details
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
