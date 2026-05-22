const express = require("express");
const { body, param, query } = require("express-validator");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
    createGig,
    getGigs,
    getGigById,
    getMyGigs,
    updateGig,
    deleteGig
} = require("../controllers/gigController");

const router = express.Router();
const experienceLevels = ["entry", "intermediate", "expert"];
const gigStatuses = ["open", "closed"];

const gigFields = [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description").trim().notEmpty().withMessage("Description is required"),
    body("skillsRequired").isArray().withMessage("Skills must be an array"),
    body("skillsRequired.*").optional().trim().notEmpty(),
    body("budgetMin").isFloat({ min: 0 }).withMessage("Minimum budget must be valid"),
    body("budgetMax")
        .isFloat({ min: 0 })
        .withMessage("Maximum budget must be valid")
        .custom((value, { req }) => Number(value) >= Number(req.body.budgetMin))
        .withMessage("Maximum budget must be at least minimum budget"),
    body("location").optional().trim(),
    body("experienceLevel").isIn(experienceLevels)
];

const optionalGigFields = [
    body("title").optional().trim().notEmpty(),
    body("description").optional().trim().notEmpty(),
    body("skillsRequired").optional().isArray(),
    body("skillsRequired.*").optional().trim().notEmpty(),
    body("budgetMin").optional().isFloat({ min: 0 }),
    body("budgetMax").optional().isFloat({ min: 0 }),
    body("location").optional().trim(),
    body("experienceLevel").optional().isIn(experienceLevels),
    body("status").optional().isIn(gigStatuses),
    body().custom((value) => {
        if (
            value.budgetMin !== undefined &&
            value.budgetMax !== undefined &&
            Number(value.budgetMax) < Number(value.budgetMin)
        ) {
            throw new Error("Maximum budget must be at least minimum budget");
        }

        return true;
    })
];

const listFilters = [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 30 }),
    query("minBudget").optional().isFloat({ min: 0 }),
    query("maxBudget").optional().isFloat({ min: 0 }),
    query("experienceLevel").optional().isIn(experienceLevels)
];

router.post("/", protect, authorizeRoles("client"), gigFields, validateRequest, createGig);
router.get("/", listFilters, validateRequest, getGigs);
router.get("/my", protect, authorizeRoles("client"), listFilters.slice(0, 2), validateRequest, getMyGigs);
router.get("/:id", param("id").isMongoId(), validateRequest, getGigById);
router.put("/:id", protect, authorizeRoles("client"), param("id").isMongoId(), optionalGigFields, validateRequest, updateGig);
router.delete("/:id", protect, authorizeRoles("client"), param("id").isMongoId(), validateRequest, deleteGig);

module.exports = router;
