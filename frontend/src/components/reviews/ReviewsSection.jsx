import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjectReviews } from "../../redux/slices/reviewSlice";
import ReviewCard from "./ReviewCard";
import LoadingSpinner from "../shared/LoadingSpinner";

export default function ReviewsSection({ projectId }) {
    const dispatch = useDispatch();
    const { reviews, isLoading } = useSelector((state) => state.review);

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectReviews(projectId));
        }
    }, [dispatch, projectId]);

    return (
        <div>
            <h2 className="text-base font-bold text-surface-905 border-b border-surface-100 pb-2 mb-3 flex items-center gap-2">
                Reviews
                {reviews.length > 0 && (
                    <span className="text-xs font-semibold text-white bg-primary-600 px-2 py-0.5 rounded-full">
                        {reviews.length}
                    </span>
                )}
            </h2>

            {isLoading ? (
                <LoadingSpinner size="md" className="py-8" />
            ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-sm text-surface-400 font-medium">
                        No reviews yet for this project.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <ReviewCard key={review._id} review={review} />
                    ))}
                </div>
            )}
        </div>
    );
}
