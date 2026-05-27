const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
    getUserProjects,
    getProjectById,
    updateProject
} = require("../controllers/projectController");

const router = express.Router();

router.get("/", protect, getUserProjects);
router.get("/:id", protect, getProjectById);
router.patch("/:id", protect, updateProject);

module.exports = router;
