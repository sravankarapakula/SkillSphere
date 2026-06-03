const express = require("express");

const {
    registerUser,
    loginUser,
    getMe,
    refreshAuthTokens,
    googleLoginController
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const { body } = require("express-validator");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post(
    "/register",
    [
        body("name").notEmpty(),
        body("email").isEmail(),
        body("password").isLength({ min: 6 }),
        body("role").optional().isIn(["client", "freelancer", "admin"])
    ],
    validateRequest,
    registerUser
);

router.post(
    "/login",
    [
        body("email").isEmail(),
        body("password").notEmpty()
    ],
    validateRequest,
    loginUser
);

router.get("/me", protect, getMe);

router.post(
    "/refresh",
    body("refreshToken").notEmpty(),
    validateRequest,
    refreshAuthTokens
);

router.post(
    "/google",
    body("credential").notEmpty(),
    validateRequest,
    googleLoginController
);

module.exports = router;
