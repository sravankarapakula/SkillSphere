import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HiXMark, HiCheckCircle } from "react-icons/hi2";
import StarRating from "./StarRating";
import { submitReview, resetReviewState } from "../../redux/slices/reviewSlice";

const CLIENT_TO_FREELANCER_CATEGORIES = [
    { key: "communication", label: "Communication" },
    { key: "qualityOfWork", label: "Quality Of Work" },
    { key: "timeliness", label: "Timeliness" },
    { key: "professionalism", label: "Professionalism" }
];

const FREELANCER_TO_CLIENT_CATEGORIES = [
    { key: "communication", label: "Communication" },
    { key: "requirementClarity", label: "Requirement Clarity" },
    { key: "responsiveness", label: "Responsiveness" },
    { key: "professionalism", label: "Professionalism" }
];

export default function ReviewModal({ isOpen, onClose, projectId, projectTitle, revieweeName, reviewerRole }) {
    const dispatch = useDispatch();
    const { isLoading, submitSuccess, isError, message } = useSelector((state) => state.review);

    const [ratings, setRatings] = useState({});
    const [comment, setComment] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const categories = reviewerRole === "client" ? CLIENT_TO_FREELANCER_CATEGORIES : FREELANCER_TO_CLIENT_CATEGORIES;

    const overallRating =
        categories.length > 0
            ? Object.values(ratings).reduce((sum, r) => sum + r, 0) / categories.length
            : 0;

    const allRated = categories.length > 0 && categories.every((cat) => ratings[cat.key] > 0);

    useEffect(() => {
        if (submitSuccess && !submitted) {
            setSubmitted(true);
        }
    }, [submitSuccess, submitted]);

    useEffect(() => {
        if (!isOpen) {
            setRatings({});
            setComment("");
            setSubmitted(false);
            dispatch(resetReviewState());
        } else {
            const initial = {};
            const cats = reviewerRole === "client" ? CLIENT_TO_FREELANCER_CATEGORIES : FREELANCER_TO_CLIENT_CATEGORIES;
            cats.forEach((cat) => {
                initial[cat.key] = 0;
            });
            setRatings(initial);
        }
    }, [isOpen, reviewerRole, dispatch]);

    const handleSubmit = () => {
        if (!allRated) return;
        dispatch(submitReview({ projectId, ratings, comment }));
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-surface-200 animate-fade-in overflow-hidden">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition z-10"
                >
                    <HiXMark className="h-5 w-5" />
                </button>

                {submitted ? (
                    /* Success State */
                    <div className="p-8 text-center">
                        <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiCheckCircle className="h-9 w-9 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-surface-900 mb-2">
                            Review Submitted!
                        </h3>
                        <p className="text-sm text-surface-500 mb-6">
                            Thank you for reviewing <span className="font-semibold text-surface-700">{revieweeName}</span>.
                            Your feedback helps the community.
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    /* Review Form */
                    <div className="p-6 sm:p-8">
                        <h2 className="text-lg font-bold text-surface-900 mb-1 pr-8">
                            Leave a Review
                        </h2>
                        <p className="text-sm text-surface-500 mb-6">
                            Rate your experience with{" "}
                            <span className="font-semibold text-surface-700">{revieweeName}</span>{" "}
                            on <span className="font-semibold text-surface-700">{projectTitle}</span>
                        </p>

                        {/* Rating Categories */}
                        <div className="space-y-4 mb-6">
                            {categories.map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-surface-700">
                                        {label}
                                    </span>
                                    <StarRating
                                        rating={ratings[key] || 0}
                                        size="lg"
                                        interactive
                                        onChange={(value) =>
                                            setRatings((prev) => ({ ...prev, [key]: value }))
                                        }
                                        showValue={false}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Overall Rating */}
                        {allRated && (
                            <div className="bg-surface-50 border border-surface-100 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
                                <span className="text-sm font-semibold text-surface-700">
                                    Overall Rating
                                </span>
                                <StarRating rating={overallRating} size="md" />
                            </div>
                        )}

                        {/* Comment */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-surface-700 mb-2">
                                Comment <span className="text-surface-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                                placeholder="Share your experience working together..."
                                rows={3}
                                className="w-full px-4 py-3 border border-surface-200 rounded-xl text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition"
                                maxLength={1000}
                            />
                            <p className="text-xs text-surface-400 mt-1 text-right">
                                {comment.length}/1000
                            </p>
                        </div>

                        {/* Error */}
                        {isError && message && (
                            <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-700 mb-4">
                                {message}
                            </p>
                        )}

                        {/* Submit */}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!allRated || isLoading}
                            className={`w-full py-3 text-sm font-semibold rounded-xl transition ${
                                allRated && !isLoading
                                    ? "bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                                    : "bg-surface-100 text-surface-400 cursor-not-allowed"
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Submitting...
                                </span>
                            ) : (
                                "Submit Review"
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
