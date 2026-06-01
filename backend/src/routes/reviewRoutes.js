const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
    createReview,
    getProjectReviews,
    getUserReviews,
    getReviewStatus
} = require("../controllers/reviewController");

const router = express.Router();

router.post("/", protect, createReview);
router.get("/project/:projectId", protect, getProjectReviews);
router.get("/user/:userId", protect, getUserReviews);
router.get("/status/:projectId", protect, getReviewStatus);

module.exports = router;
