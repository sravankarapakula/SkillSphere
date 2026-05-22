const express = require("express");
const { body, param } = require("express-validator");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
    createProposal,
    getMyProposals,
    getGigProposals,
    updateProposalStatus
} = require("../controllers/proposalController");

const router = express.Router();

router.post(
    "/",
    protect,
    authorizeRoles("freelancer"),
    [
        body("gig").isMongoId(),
        body("coverLetter").trim().notEmpty().withMessage("Cover letter is required"),
        body("bidAmount").isFloat({ min: 0.01 }).withMessage("Bid amount must be valid"),
        body("estimatedDays").isInt({ min: 1 }).withMessage("Estimated days must be valid")
    ],
    validateRequest,
    createProposal
);

router.get("/my", protect, authorizeRoles("freelancer"), getMyProposals);
router.get(
    "/gig/:gigId",
    protect,
    authorizeRoles("client"),
    param("gigId").isMongoId(),
    validateRequest,
    getGigProposals
);
router.patch(
    "/:id/status",
    protect,
    authorizeRoles("client"),
    [
        param("id").isMongoId(),
        body("status").isIn(["accepted", "rejected"])
    ],
    validateRequest,
    updateProposalStatus
);

module.exports = router;
