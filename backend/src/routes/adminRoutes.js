const express = require("express");
const { body, param, query } = require("express-validator");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const admin = require("../controllers/adminController");

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/analytics", admin.getAdminAnalytics);

router.get("/users", [
    query("role").optional().isIn(["client", "freelancer", "admin"]),
    query("status").optional().isIn(["active", "suspended"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 })
], validateRequest, admin.getAdminUsers);
router.get("/users/:userId", param("userId").isMongoId(), validateRequest, admin.getAdminUserDetails);
router.patch("/users/:userId/suspend", [
    param("userId").isMongoId(),
    body("reason").trim().notEmpty().withMessage("Suspension reason is required")
], validateRequest, admin.suspendUser);
router.patch("/users/:userId/unsuspend", param("userId").isMongoId(), validateRequest, admin.unsuspendUser);

router.get("/gigs", admin.getAdminGigs);
router.get("/gigs/:gigId", param("gigId").isMongoId(), validateRequest, admin.getAdminGigDetails);
router.patch("/gigs/:gigId/disable", [
    param("gigId").isMongoId(),
    body("reason").trim().notEmpty().withMessage("Disable reason is required")
], validateRequest, admin.disableGig);
router.patch("/gigs/:gigId/enable", param("gigId").isMongoId(), validateRequest, admin.enableGig);

router.get("/projects", admin.getAdminProjects);
router.get("/projects/:projectId", param("projectId").isMongoId(), validateRequest, admin.getAdminProjectDetails);

router.get("/reviews", admin.getAdminReviews);
router.get("/reviews/:reviewId", param("reviewId").isMongoId(), validateRequest, admin.getAdminReviewDetails);
router.patch("/reviews/:reviewId/hide", param("reviewId").isMongoId(), validateRequest, admin.hideReview);
router.patch("/reviews/:reviewId/restore", param("reviewId").isMongoId(), validateRequest, admin.restoreReview);

router.get("/deliverables", admin.getAdminDeliverables);
router.get("/deliverables/:deliverableId", param("deliverableId").isMongoId(), validateRequest, admin.getAdminDeliverableDetails);

module.exports = router;
