const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
    getClientDashboard,
    getFreelancerDashboard,
    getAdminDashboard
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/client", protect, authorizeRoles("client"), getClientDashboard);
router.get("/freelancer", protect, authorizeRoles("freelancer"), getFreelancerDashboard);
router.get("/admin", protect, authorizeRoles("admin"), getAdminDashboard);

module.exports = router;
