const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getUpcomingTasks } = require("../controllers/milestoneController");

const router = express.Router();

router.get("/upcoming", protect, getUpcomingTasks);

module.exports = router;
