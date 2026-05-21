export default function LoadingSpinner({ size = "md", className = "" }) {
    const sizeClasses = {
        sm: "h-5 w-5",
        md: "h-8 w-8",
        lg: "h-12 w-12",
        xl: "h-16 w-16"
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="relative">
                <div
                    className={`${sizeClasses[size]} rounded-full border-[3px] border-surface-200 border-t-primary-600 animate-spin`}
                />
                <div
                    className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-[3px] border-transparent border-b-accent-400 animate-spin`}
                    style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
                />
            </div>
        </div>
    );
}

export function FullPageSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="xl" />
                <p className="text-surface-500 text-sm font-medium animate-pulse">
                    Loading...
                </p>
            </div>
        </div>
    );
}
