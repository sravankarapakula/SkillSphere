import { HiOutlineTrash, HiOutlineArrowTopRightOnSquare } from "react-icons/hi2";

export default function PortfolioCard({ item, onRemove, readOnly = false }) {
    return (
        <div className="group relative bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {/* Image */}
            {item.imageUrl ? (
                <div className="aspect-video bg-surface-100 overflow-hidden">
                    <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
            ) : (
                <div className="aspect-video bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary-300">
                        {item.title?.[0]?.toUpperCase() || "P"}
                    </span>
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                <h4 className="font-semibold text-surface-900 text-sm mb-1 truncate">
                    {item.title}
                </h4>
                {item.description && (
                    <p className="text-xs text-surface-500 line-clamp-2">
                        {item.description}
                    </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                    {item.projectUrl && (
                        <a
                            href={item.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                        >
                            <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                            View Project
                        </a>
                    )}
                    {!readOnly && onRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(item._id)}
                            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-danger hover:text-red-600 cursor-pointer"
                        >
                            <HiOutlineTrash className="h-3.5 w-3.5" />
                            Remove
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
