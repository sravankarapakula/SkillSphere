import { useState } from "react";
import { HiStar } from "react-icons/hi2";

const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-6 w-6"
};

export default function StarRating({
    rating = 0,
    maxStars = 5,
    size = "md",
    interactive = false,
    onChange,
    showValue = true
}) {
    const [hoverRating, setHoverRating] = useState(0);
    const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;
    const starSize = sizeClasses[size] || sizeClasses.md;

    const handleClick = (starIndex) => {
        if (interactive && onChange) {
            onChange(starIndex);
        }
    };

    const renderStar = (index) => {
        const starValue = index + 1;
        const filled = displayRating >= starValue;
        const halfFilled = !filled && displayRating >= starValue - 0.5;

        if (interactive) {
            return (
                <button
                    key={index}
                    type="button"
                    className="focus:outline-none transition-transform hover:scale-110"
                    onClick={() => handleClick(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                >
                    <HiStar
                        className={`${starSize} transition-colors ${
                            (hoverRating > 0 ? starValue <= hoverRating : starValue <= rating)
                                ? "text-amber-400"
                                : "text-surface-300"
                        }`}
                    />
                </button>
            );
        }

        if (halfFilled) {
            return (
                <span key={index} className="relative inline-block">
                    <HiStar className={`${starSize} text-surface-300`} />
                    <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                        <HiStar className={`${starSize} text-amber-400`} />
                    </span>
                </span>
            );
        }

        return (
            <HiStar
                key={index}
                className={`${starSize} ${filled ? "text-amber-400" : "text-surface-300"}`}
            />
        );
    };

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center">
                {Array.from({ length: maxStars }, (_, i) => renderStar(i))}
            </div>
            {showValue && (
                <span className="text-sm font-semibold text-surface-700 ml-1">
                    {displayRating > 0 ? displayRating.toFixed(1) : "0.0"}
                </span>
            )}
        </div>
    );
}
