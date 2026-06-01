import StarRating from "./StarRating";

export default function ReviewCard({ review }) {
    if (!review) return null;

    const reviewer = review.reviewer || {};
    const ratings = review.ratings || {};
    const overallRating = review.overallRating || 0;
    const createdAt = review.createdAt
        ? new Date(review.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric"
          })
        : "";

    const isClientReview = review.reviewType === "client_to_freelancer" || 
        ratings.qualityOfWork !== undefined || 
        ratings.quality !== undefined;

    const categories = isClientReview
        ? [
              { key: "communication", label: "Communication" },
              { key: "qualityOfWork", label: "Quality Of Work" },
              { key: "timeliness", label: "Timeliness" },
              { key: "professionalism", label: "Professionalism" }
          ]
        : [
              { key: "communication", label: "Communication" },
              { key: "requirementClarity", label: "Requirement Clarity" },
              { key: "responsiveness", label: "Responsiveness" },
              { key: "professionalism", label: "Professionalism" }
          ];

    return (
        <div className="bg-white rounded-xl border border-surface-200 p-5">
            {/* Header: Avatar, Name, Date, Overall Rating */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    {reviewer.profileImage ? (
                        <img
                            src={reviewer.profileImage}
                            alt={reviewer.name}
                            className="h-10 w-10 rounded-full object-cover border border-surface-200 flex-shrink-0"
                        />
                    ) : (
                        <div className="h-10 w-10 bg-primary-100 text-primary-700 font-bold rounded-full flex items-center justify-center text-sm border border-primary-200 flex-shrink-0">
                            {reviewer.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-surface-800 truncate">
                            {reviewer.name || "Anonymous"}
                        </h4>
                        {createdAt && (
                            <p className="text-xs text-surface-400">{createdAt}</p>
                        )}
                    </div>
                </div>
                <StarRating rating={overallRating} size="sm" />
            </div>

            {/* Category Ratings */}
            <div className="flex flex-wrap gap-2 mb-3">
                {categories.map(({ key, label }) => {
                    const value = ratings[key] !== undefined 
                        ? ratings[key] 
                        : (key === "qualityOfWork" ? ratings.quality : undefined);
                    return (
                        value != null && (
                            <span
                                key={key}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-50 border border-surface-100 rounded-lg text-xs font-medium text-surface-600"
                            >
                                {label}
                                <span className="font-bold text-surface-800">{value}</span>
                            </span>
                        )
                    );
                })}
            </div>

            {/* Comment */}
            {review.comment && (
                <p className="text-sm text-surface-600 leading-relaxed">
                    {review.comment}
                </p>
            )}
        </div>
    );
}
