import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitNewDeliverables, clearDeliverableError } from "../../redux/slices/deliverableSlice";
import Button from "../shared/Button";
import {
    HiOutlineCloudArrowUp,
    HiOutlineDocument,
    HiOutlinePhoto,
    HiOutlineXMark,
    HiOutlineDocumentText,
    HiOutlineArchiveBox
} from "react-icons/hi2";

const FILE_TYPE_ICONS = {
    image: HiOutlinePhoto,
    pdf: HiOutlineDocumentText,
    archive: HiOutlineArchiveBox,
    default: HiOutlineDocument
};

const getFileCategory = (type) => {
    if (type?.startsWith("image/")) return "image";
    if (type === "application/pdf") return "pdf";
    if (["application/zip", "application/x-rar-compressed", "application/x-7z-compressed", "application/gzip"].includes(type)) return "archive";
    return "default";
};

const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function DeliverableSubmissionModal({
    isOpen,
    onClose,
    milestoneId,
    milestoneTitle = "",
    onSubmitSuccess
}) {
    const dispatch = useDispatch();
    const { isSubmitting } = useSelector((state) => state.deliverable);

    const [files, setFiles] = useState([]);
    const [notes, setNotes] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setFiles([]);
            setNotes("");
            setError("");
            dispatch(clearDeliverableError());
        }
    }, [isOpen, dispatch]);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && !isSubmitting) onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, isSubmitting]);

    const addFiles = useCallback((newFiles) => {
        const fileArray = Array.from(newFiles);
        const maxFiles = 10;
        const maxSize = 25 * 1024 * 1024; // 25MB

        const validFiles = [];
        for (const file of fileArray) {
            if (files.length + validFiles.length >= maxFiles) {
                setError(`Maximum ${maxFiles} files allowed per submission`);
                break;
            }
            if (file.size > maxSize) {
                setError(`File "${file.name}" exceeds the 25MB limit`);
                continue;
            }
            // Check for duplicates
            const isDuplicate = files.some(f => f.name === file.name && f.size === file.size);
            if (isDuplicate) {
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
            setError("");
        }
    }, [files]);

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (files.length === 0) {
            setError("Please add at least one file to submit");
            return;
        }

        const formData = new FormData();
        files.forEach((file) => {
            formData.append("deliverableFiles", file);
        });
        if (notes.trim()) {
            formData.append("notes", notes.trim());
        }

        try {
            const result = await dispatch(submitNewDeliverables({ milestoneId, formData })).unwrap();
            if (result.success) {
                onSubmitSuccess?.(result.data);
                onClose();
            }
        } catch (err) {
            setError(err || "Failed to submit deliverables");
        }
    };

    if (!isOpen) return null;

    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={!isSubmitting ? onClose : undefined} />

            <div className="relative w-full max-w-2xl bg-white border border-surface-200 shadow-2xl rounded-2xl z-10 transform transition-all duration-300 ease-out max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-surface-100">
                    <div>
                        <h3 className="text-xl font-bold text-surface-900">Submit Deliverables</h3>
                        {milestoneTitle && (
                            <p className="text-sm text-surface-500 font-medium mt-1">
                                For: <span className="text-surface-700 font-semibold">{milestoneTitle}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={!isSubmitting ? onClose : undefined}
                        className="text-surface-400 hover:text-surface-600 transition-colors p-1.5 hover:bg-surface-50 rounded-lg cursor-pointer"
                        aria-label="Close modal"
                        disabled={isSubmitting}
                    >
                        <HiOutlineXMark className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-sm text-danger font-medium flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Drop Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer ${
                            dragOver
                                ? "border-primary-400 bg-primary-50/50"
                                : "border-surface-250 hover:border-primary-300 hover:bg-surface-50/50"
                        }`}
                        onClick={() => document.getElementById("deliverable-file-input")?.click()}
                    >
                        <HiOutlineCloudArrowUp className={`w-12 h-12 mx-auto mb-3 ${dragOver ? "text-primary-500" : "text-surface-400"}`} />
                        <p className="text-sm font-semibold text-surface-700">
                            Drag & drop files here, or <span className="text-primary-600 underline">browse</span>
                        </p>
                        <p className="text-xs text-surface-400 mt-1.5">
                            Supports images, PDFs, documents, code files, archives • Max 10 files • 25MB each
                        </p>
                        <input
                            id="deliverable-file-input"
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.length > 0) {
                                    addFiles(e.target.files);
                                }
                                e.target.value = "";
                            }}
                        />
                    </div>

                    {/* Selected Files List */}
                    {files.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-surface-800">
                                    Selected Files ({files.length})
                                </h4>
                                <span className="text-xs text-surface-500 font-medium">
                                    Total: {formatFileSize(totalSize)}
                                </span>
                            </div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {files.map((file, index) => {
                                    const category = getFileCategory(file.type);
                                    const Icon = FILE_TYPE_ICONS[category];
                                    return (
                                        <div
                                            key={`${file.name}-${index}`}
                                            className="flex items-center justify-between p-2.5 bg-surface-50 rounded-xl border border-surface-100 group hover:border-surface-200 transition-all"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                                                    category === "image" ? "bg-blue-50 text-blue-600" :
                                                    category === "pdf" ? "bg-red-50 text-red-600" :
                                                    category === "archive" ? "bg-amber-50 text-amber-600" :
                                                    "bg-surface-100 text-surface-600"
                                                }`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-surface-800 truncate">{file.name}</p>
                                                    <p className="text-[11px] text-surface-400">{formatFileSize(file.size)}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="p-1 text-surface-400 hover:text-danger hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                                aria-label={`Remove ${file.name}`}
                                            >
                                                <HiOutlineXMark className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-surface-700 mb-1.5" htmlFor="deliverable-notes">
                            Submission Notes <span className="text-surface-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            id="deliverable-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe what you're submitting, any special instructions for review, or highlight important changes..."
                            rows="4"
                            maxLength={5000}
                            className="w-full px-4 py-2.5 bg-surface-55 border border-surface-200 rounded-xl text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all resize-none text-sm"
                        />
                        <p className="text-[11px] text-surface-400 mt-1 text-right">{notes.length}/5000</p>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-surface-100">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-24 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        disabled={files.length === 0}
                        onClick={handleSubmit}
                        className="px-6 rounded-xl bg-violet-600 hover:bg-violet-700"
                    >
                        <HiOutlineCloudArrowUp className="w-4 h-4" />
                        Submit Deliverables
                    </Button>
                </div>
            </div>
        </div>
    );
}
