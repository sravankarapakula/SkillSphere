import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { HiOutlineArrowLeft, HiOutlineClock, HiOutlineStar } from "react-icons/hi2";
import { fetchProjectById, updateProjectDetails, resetProjectState } from "../../redux/slices/projectSlice";
import { setActiveConversation } from "../../redux/slices/messageSlice";
import { createPaymentOrder, verifyPaymentSignature, fetchProjectPaymentDetails } from "../../redux/slices/paymentSlice";
import StatusBadge from "../../components/proposals/StatusBadge";
import ChatWindow from "../../components/chat/ChatWindow";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Button from "../../components/shared/Button";
import MilestonePanel from "../../components/projects/MilestonePanel";
import ReviewModal from "../../components/reviews/ReviewModal";
import ReviewsSection from "../../components/reviews/ReviewsSection";
import { getReviewStatus } from "../../api/reviewApi";
import { toast } from "react-hot-toast";

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function ProjectWorkspace() {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { onlineUsers } = useSelector((state) => state.message);
    const { currentProject, currentConversation, isLoading, error, isSuccess } = useSelector((state) => state.project);
    const { currentPayment } = useSelector((state) => state.payment || {});

    const [updating, setUpdating] = useState(false);
    const [actionError, setActionError] = useState("");
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewStatus, setReviewStatus] = useState(null);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        dispatch(fetchProjectById(projectId));
        return () => {
            dispatch(resetProjectState());
        };
    }, [dispatch, projectId]);

    useEffect(() => {
        if (currentProject?.paymentStatus === "paid") {
            dispatch(fetchProjectPaymentDetails(projectId));
        }
    }, [currentProject?.paymentStatus, projectId, dispatch]);

    const handlePayNow = async () => {
        try {
            setPaying(true);
            const orderResult = await dispatch(createPaymentOrder(projectId)).unwrap();
            const success = await loadRazorpayScript();
            if (!success) {
                toast.error("Razorpay Checkout script failed to load. Please check your connection.");
                setPaying(false);
                return;
            }

            const options = {
                key: orderResult.key,
                amount: orderResult.amount,
                currency: "INR",
                name: "SkillSphere",
                description: "Freelance Project Payment",
                order_id: orderResult.orderId,
                handler: async function (response) {
                    try {
                        toast.loading("Verifying transaction...");
                        await dispatch(
                            verifyPaymentSignature({
                                projectId,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        ).unwrap();
                        toast.dismiss();
                        toast.success("Payment completed successfully!");
                    } catch (err) {
                        toast.dismiss();
                        toast.error(err || "Payment verification failed");
                    } finally {
                        setPaying(false);
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || ""
                },
                theme: {
                    color: "#2563EB"
                },
                modal: {
                    ondismiss: function () {
                        setPaying(false);
                    }
                }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toast.error(err || "Failed to initiate payment");
            setPaying(false);
        }
    };

    useEffect(() => {
        if (currentConversation) {
            dispatch(setActiveConversation(currentConversation._id));
        }
    }, [currentConversation, dispatch]);

    useEffect(() => {
        if (currentProject?.status === "completed") {
            getReviewStatus(projectId)
                .then((res) => setReviewStatus(res.data))
                .catch(() => setReviewStatus(null));
        }
    }, [currentProject?.status, projectId]);

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
    const agreedAmount = currentProject.agreedAmount || 0;

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
                        <h1 className="text-xl md:text-2xl font-bold text-surface-950 truncate">
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

                {projectStatus === "completed" && reviewStatus?.canReview && !reviewStatus?.hasReviewed && (
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowReviewModal(true)}
                    >
                        <HiOutlineStar className="h-4 w-4" />
                        Leave a Review
                    </Button>
                )}
            </div>

            {actionError && (
                <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-700 flex-shrink-0">
                    {actionError}
                </p>
            )}

            {projectStatus === "completed" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3 flex-shrink-0">
                    <span className="text-emerald-600 text-sm font-semibold">✓ Project Completed</span>
                    {reviewStatus?.hasReviewed && (
                        <span className="text-emerald-500 text-xs font-medium">• Review submitted</span>
                    )}
                </div>
            )}

            {/* Split Screen Panel */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 overflow-hidden h-full">
                {/* Left Panel: Project Details & Milestones */}
                <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm overflow-y-auto space-y-6 scrollbar-thin">
                    {/* Project Overview details */}
                    <div>
                        <h2 className="text-base font-bold text-surface-905 border-b border-surface-100 pb-2 mb-3">
                            Project Details
                        </h2>
                        <p className="text-sm text-surface-600 leading-relaxed whitespace-pre-wrap font-medium">
                            {currentProject.gig?.description || "No contract description available."}
                        </p>
                    </div>

                    {/* Progress (Read Only) */}
                    <div className="bg-surface-50 border border-surface-100 rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold text-surface-900 flex items-center justify-between">
                            <span>Project Progress</span>
                            <span className="text-primary-700 font-semibold text-base">
                                {currentProject.progressPercentage || 0}%
                            </span>
                        </h3>
                        <div className="space-y-3">
                            <div className="h-2.5 w-full bg-surface-150 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-300"
                                    style={{ width: `${currentProject.progressPercentage || 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Overview */}
                    <div className="bg-surface-50 border border-surface-100 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-surface-150 pb-2.5">
                            <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${currentProject.paymentStatus === "paid" ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
                                Payment Overview
                            </h3>
                            <span className="text-primary-700 font-bold text-base">
                                ₹{currentProject.paymentAmount || currentProject.agreedAmount || 0}
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-surface-500">Status:</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                                        currentProject.paymentStatus === "paid"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}>
                                        {currentProject.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                                    </span>
                                </div>
                                {currentProject.paymentStatus === "paid" && (
                                    <>
                                        {currentProject.paymentDate && (
                                            <p className="text-xs text-surface-500 font-semibold">
                                                Paid At: <span className="text-surface-800">{new Date(currentProject.paymentDate).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                            </p>
                                        )}
                                        {currentPayment?.razorpayPaymentId && (
                                            <p className="text-xs text-surface-500 font-semibold">
                                                Transaction ID: <span className="text-surface-850 font-mono select-all bg-surface-100 px-2 py-0.5 rounded border border-surface-200">{currentPayment.razorpayPaymentId}</span>
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            {isClient && currentProject.paymentStatus === "unpaid" && (
                                <button
                                    onClick={handlePayNow}
                                    disabled={paying}
                                    className="cursor-pointer inline-flex items-center justify-center px-4 py-2 font-bold text-xs rounded-xl text-white bg-primary-600 hover:bg-primary-700 border border-transparent shadow-sm transition disabled:opacity-50"
                                >
                                    {paying ? "Processing..." : "Pay Now"}
                                </button>
                            )}
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

                    <MilestonePanel
                        projectId={projectId}
                        isClient={isClient}
                        projectStatus={projectStatus}
                        agreedAmount={agreedAmount}
                    />

                    {projectStatus === "completed" && (
                        <ReviewsSection projectId={projectId} />
                    )}
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

            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => {
                    setShowReviewModal(false);
                    getReviewStatus(projectId)
                        .then((res) => setReviewStatus(res.data))
                        .catch(() => {});
                }}
                projectId={projectId}
                projectTitle={currentProject.gig?.title || "This Project"}
                revieweeName={partner?.name || "Participant"}
                reviewerRole={reviewStatus?.reviewerRole}
            />
        </div>
    );
}
