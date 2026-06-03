import {
    HiOutlineDocument,
    HiOutlinePhoto,
    HiOutlineDocumentText,
    HiOutlineArchiveBox,
    HiOutlineArrowDownTray,
    HiOutlineCodeBracket,
    HiOutlineFilm
} from "react-icons/hi2";
import { downloadFile } from "../../utils/downloadHelper";

const getFileCategory = (fileType) => {
    if (!fileType) return "default";
    if (fileType.startsWith("image/")) return "image";
    if (fileType === "application/pdf") return "pdf";
    if (fileType.startsWith("video/")) return "video";
    if (["application/zip", "application/x-rar-compressed", "application/x-7z-compressed", "application/gzip", "application/x-tar"].includes(fileType)) return "archive";
    if (["text/javascript", "text/html", "text/css", "text/plain", "text/csv", "text/markdown", "application/json", "application/xml"].includes(fileType)) return "code";
    return "default";
};

const CATEGORY_CONFIG = {
    image: { Icon: HiOutlinePhoto, color: "bg-blue-50 text-blue-600 border-blue-100" },
    pdf: { Icon: HiOutlineDocumentText, color: "bg-red-50 text-red-600 border-red-100" },
    video: { Icon: HiOutlineFilm, color: "bg-purple-50 text-purple-600 border-purple-100" },
    archive: { Icon: HiOutlineArchiveBox, color: "bg-amber-50 text-amber-600 border-amber-100" },
    code: { Icon: HiOutlineCodeBracket, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    default: { Icon: HiOutlineDocument, color: "bg-surface-50 text-surface-600 border-surface-100" }
};

const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function DeliverableFilePreview({ files = [], compact = false }) {
    if (!files || files.length === 0) {
        return (
            <p className="text-sm text-surface-400 italic">No files attached</p>
        );
    }

    if (compact) {
        return (
            <div className="flex flex-wrap gap-2">
                {files.map((file) => {
                    const category = getFileCategory(file.fileType);
                    const { Icon, color } = CATEGORY_CONFIG[category];
                    return (
                        <a
                            key={file._id || file.url}
                            href="#"
                            onClick={(e) => { e.preventDefault(); downloadFile(file.url, file.fileName, file.fileType); }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:shadow-sm ${color}`}
                            title={file.fileName}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[120px]">{file.fileName}</span>
                        </a>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {files.map((file) => {
                const category = getFileCategory(file.fileType);
                const { Icon, color } = CATEGORY_CONFIG[category];
                const isImage = category === "image";

                return (
                    <div
                        key={file._id || file.url}
                        className="rounded-xl border border-surface-150 overflow-hidden bg-white hover:border-surface-250 transition-all group"
                    >
                        {/* Image preview */}
                        {isImage && file.url && (
                            <div className="relative w-full aspect-video bg-surface-50 overflow-hidden">
                                <img
                                    src={file.url}
                                    alt={file.fileName}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            </div>
                        )}

                        {/* File info bar */}
                        <div className="flex items-center justify-between p-3 gap-3">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={`p-1.5 rounded-lg flex-shrink-0 border ${color}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-surface-800 truncate">{file.fileName}</p>
                                    <p className="text-[11px] text-surface-400 flex items-center gap-2">
                                        {file.fileType && <span>{file.fileType.split("/").pop()?.toUpperCase()}</span>}
                                        {file.fileSize > 0 && <span>• {formatFileSize(file.fileSize)}</span>}
                                    </p>
                                </div>
                            </div>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); downloadFile(file.url, file.fileName, file.fileType); }}
                                className="p-2 text-surface-400 hover:text-primary-600 hover:bg-primary-50 border border-surface-150 hover:border-primary-200 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                title={`Download ${file.fileName}`}
                            >
                                <HiOutlineArrowDownTray className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
