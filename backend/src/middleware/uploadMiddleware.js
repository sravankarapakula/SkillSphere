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

module.exports = {
    uploadProfileImage,
    uploadResume,
    uploadPortfolioImage
};
