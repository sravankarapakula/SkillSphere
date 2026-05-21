import { useRef } from "react";
import { HiOutlineCloudArrowUp } from "react-icons/hi2";

export default function FileUpload({
    label,
    accept,
    onChange,
    currentFile,
    isLoading = false,
    hint
}) {
    const inputRef = useRef(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file && onChange) {
            onChange(file);
        }
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-surface-700">
                    {label}
                </label>
            )}
            <div
                onClick={handleClick}
                className="relative border-2 border-dashed border-surface-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-200"
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleChange}
                    className="hidden"
                />
                <HiOutlineCloudArrowUp className="h-8 w-8 text-surface-400 mx-auto mb-2" />
                <p className="text-sm text-surface-600 font-medium">
                    {isLoading ? "Uploading..." : "Click to upload"}
                </p>
                {hint && (
                    <p className="text-xs text-surface-400 mt-1">{hint}</p>
                )}
                {currentFile && (
                    <p className="text-xs text-primary-600 mt-2 truncate font-medium">
                        ✓ File uploaded
                    </p>
                )}
            </div>
        </div>
    );
}
