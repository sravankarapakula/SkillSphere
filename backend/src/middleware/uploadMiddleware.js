const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Profile image upload — images only, max 5MB
const profileImageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "skillsphere/profile-images",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }]
    }
});

// Resume upload — PDF only, max 10MB
const resumeStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "skillsphere/resumes",
        allowed_formats: ["pdf"],
        resource_type: "raw"
    }
});

// Portfolio image upload — images only, max 10MB
const portfolioStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "skillsphere/portfolio",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 1200, height: 800, crop: "limit" }]
    }
});

// Deliverable file upload — mixed types, max 25MB per file
const deliverableStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const isImage = file.mimetype.startsWith("image/");
        return {
            folder: "skillsphere/deliverables",
            resource_type: isImage ? "image" : "raw",
            allowed_formats: [
                "jpg", "jpeg", "png", "webp", "gif",
                "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
                "zip", "rar", "7z", "tar", "gz",
                "txt", "csv", "json", "xml", "md",
                "js", "ts", "py", "java", "cpp", "c", "html", "css",
                "svg", "fig", "sketch", "psd", "ai",
                "mp4", "mov", "avi"
            ]
        };
    }
});

// File filter for images
const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

// File filter for PDFs
const pdfFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed"), false);
    }
};

// File filter for deliverable files — allow common document, image, archive, and code types
const ALLOWED_DELIVERABLE_MIMES = new Set([
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
    "application/pdf",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
    "application/gzip", "application/x-tar",
    "text/plain", "text/csv", "text/html", "text/css", "text/javascript", "text/markdown",
    "application/json", "application/xml",
    "video/mp4", "video/quicktime", "video/x-msvideo",
    "application/octet-stream"
]);

const deliverableFilter = (req, file, cb) => {
    if (ALLOWED_DELIVERABLE_MIMES.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not allowed for deliverables`), false);
    }
};

const uploadProfileImage = multer({
    storage: profileImageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).single("profileImage");

const uploadResume = multer({
    storage: resumeStorage,
    fileFilter: pdfFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single("resume");

const uploadPortfolioImage = multer({
    storage: portfolioStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single("portfolioImage");

const uploadDeliverables = multer({
    storage: deliverableStorage,
    fileFilter: deliverableFilter,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB per file
}).array("deliverableFiles", 10); // max 10 files

module.exports = {
    uploadProfileImage,
    uploadResume,
    uploadPortfolioImage,
    uploadDeliverables
};
