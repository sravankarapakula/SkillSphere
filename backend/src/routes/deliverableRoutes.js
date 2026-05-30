const express = require("express");
const protect = require("../middleware/authMiddleware");
const { uploadDeliverables } = require("../middleware/uploadMiddleware");
const {
    submitDeliverables,
    getDeliverables,
    getDeliverableById,
    reviewDeliverable
} = require("../controllers/deliverableController");

const router = express.Router();

// POST /api/deliverables/:milestoneId/submit — Freelancer submits deliverable files + notes
router.post("/:milestoneId/submit", protect, uploadDeliverables, submitDeliverables);

// GET /api/deliverables/:milestoneId — Get all deliverables for a milestone (version history)
router.get("/:milestoneId", protect, getDeliverables);

// GET /api/deliverables/detail/:deliverableId — Get single deliverable
router.get("/detail/:deliverableId", protect, getDeliverableById);

// PATCH /api/deliverables/:deliverableId/review — Client approves or rejects
router.patch("/:deliverableId/review", protect, reviewDeliverable);

module.exports = router;
