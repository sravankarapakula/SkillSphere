const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
    uploadProfileImage,
    uploadResume,
    uploadPortfolioImage
} = require("../middleware/uploadMiddleware");

const {
    getMyProfile,
    getProfileByUserId,
    createOrUpdateProfile,
    uploadProfileImageHandler,
    uploadResumeHandler,
    addPortfolioItem,
    removePortfolioItem
} = require("../controllers/profileController");

// All profile routes require authentication
// Only freelancers can manage their own profiles

router.get(
    "/me",
    protect,
    authorizeRoles("freelancer"),
    getMyProfile
);

router.get(
    "/user/:userId",
    getProfileByUserId
);

router.put(
    "/",
    protect,
    authorizeRoles("freelancer"),
    createOrUpdateProfile
);

router.post(
    "/image",
    protect,
    authorizeRoles("freelancer"),
    uploadProfileImage,
    uploadProfileImageHandler
);

router.post(
    "/resume",
    protect,
    authorizeRoles("freelancer"),
    uploadResume,
    uploadResumeHandler
);

router.post(
    "/portfolio",
    protect,
    authorizeRoles("freelancer"),
    uploadPortfolioImage,
    addPortfolioItem
);

router.delete(
    "/portfolio/:itemId",
    protect,
    authorizeRoles("freelancer"),
    removePortfolioItem
);

module.exports = router;
