const express = require("express");

const {
    registerUser,
    loginUser,
    getMe
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const { body } = require("express-validator");

const router = express.Router();

router.post(
    "/register",
    [
        body("name").notEmpty(),
        body("email").isEmail(),
        body("password").isLength({ min: 6 })
    ],
    registerUser
);

router.post("/login", loginUser);

router.get("/me", protect, getMe);

module.exports = router;