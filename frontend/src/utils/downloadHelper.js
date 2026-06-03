import axios from "axios";

/**
 * Maps common MIME types to their corresponding file extensions.
 */
const MIME_EXTENSIONS = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "application/zip": ".zip",
    "application/x-rar-compressed": ".rar",
    "application/x-7z-compressed": ".7z",
    "application/gzip": ".tar.gz",
    "application/x-tar": ".tar",
    "text/plain": ".txt",
    "text/csv": ".csv",
    "text/html": ".html",
    "text/css": ".css",
    "text/javascript": ".js",
    "text/markdown": ".md",
    "application/json": ".json",
    "application/xml": ".xml",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/x-msvideo": ".avi"
};

/**
 * Handles legacy or extensionless filenames gracefully.
 * Resolves the original extension from mimetype if not present in original name.
 */
export const getFileNameWithExtension = (fileName, url, fileType) => {
    let name = fileName || "";
    
    // Extract filename from URL as fallback if not provided
    if (!name && url) {
        const parts = url.split("/");
        name = parts[parts.length - 1] || "file";
    }
    
    if (!name) name = "file";
    
    // If filename has no dot/extension, try to append based on mimetype
    if (!name.includes(".") && fileType) {
        const ext = MIME_EXTENSIONS[fileType];
        if (ext) {
            name += ext;
        }
    }
    
    return name;
};

/**
 * Downloads a file by fetching it as a blob and triggering a local same-origin link click.
 * This preserves original filename and extension for raw files downloaded from Cloudinary.
 * 
 * @param {string} url - The Cloudinary file URL
 * @param {string} fileName - Original filename
 * @param {string} fileType - MIME type
 */
export const downloadFile = async (url, fileName, fileType) => {
    if (!url) return;
    
    const resolvedName = getFileNameWithExtension(fileName, url, fileType);
    
    try {
        // Fetch as blob using raw axios (avoid sending backend auth headers to Cloudinary)
        const response = await axios.get(url, {
            responseType: "blob",
            timeout: 60000 // 1 minute timeout
        });
        
        const blob = new Blob([response.data], { type: fileType || "application/octet-stream" });
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = resolvedName;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Failed to download file via blob, falling back to direct URL navigation:", error);
        window.open(url, "_blank");
    }
};

/**
 * Fetches a file as a blob and opens it in a new tab.
 * Crucial for viewing extensionless PDFs inline in browser built-in reader.
 * 
 * @param {string} url - The Cloudinary file URL
 * @param {string} fileType - MIME type (defaults to application/pdf)
 */
export const viewFileInNewTab = async (url, fileType = "application/pdf") => {
    if (!url) return;
    
    try {
        const response = await axios.get(url, {
            responseType: "blob",
            timeout: 60000
        });
        
        const blob = new Blob([response.data], { type: fileType });
        const blobUrl = window.URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        
        // Cannot revoke immediately since the new tab needs to read the blob,
        // it will be garbage collected by the browser when the tab/page is closed.
    } catch (error) {
        console.error("Failed to view file via blob, falling back to direct URL navigation:", error);
        window.open(url, "_blank");
    }
};
