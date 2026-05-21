const variants = {
    primary:
        "bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg",
    secondary:
        "bg-surface-100 hover:bg-surface-200 text-surface-800 border border-surface-300",
    outline:
        "border-2 border-primary-600 text-primary-600 hover:bg-primary-50",
    danger:
        "bg-danger hover:bg-red-600 text-white shadow-md hover:shadow-lg",
    ghost:
        "text-surface-600 hover:bg-surface-100 hover:text-surface-800"
};

const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
};

export default function Button({
    children,
    variant = "primary",
    size = "md",
    className = "",
    isLoading = false,
    disabled = false,
    type = "button",
    onClick,
    ...props
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`
                inline-flex items-center justify-center gap-2
                font-semibold rounded-xl
                transition-all duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                cursor-pointer
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
            {...props}
        >
            {isLoading && (
                <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}
