const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
    createOrder,
    verifyPayment,
    getMyPayments,
    getProjectPayment
} = require("../controllers/paymentController");

const router = express.Router();

// Client-only endpoints
router.post("/create-order", protect, authorizeRoles("client"), createOrder);
router.post("/verify", protect, authorizeRoles("client"), verifyPayment);

// Shared role endpoints
router.get("/my", protect, getMyPayments);
router.get("/project/:projectId", protect, getProjectPayment);

module.exports = router;
