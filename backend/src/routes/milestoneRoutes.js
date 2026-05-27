const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
    createMilestone,
    getProjectMilestones,
    updateMilestone,
    deleteMilestone,
    updateMilestoneStatus
} = require("../controllers/milestoneController");

const router = express.Router();

router.post("/", protect, createMilestone);
router.get("/project/:projectId", protect, getProjectMilestones);
router.put("/:id", protect, updateMilestone);
router.delete("/:id", protect, deleteMilestone);
router.patch("/:id/status", protect, updateMilestoneStatus);

module.exports = router;
