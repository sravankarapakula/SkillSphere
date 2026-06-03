const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user.models");
const { generateTokenPair } = require("../utils/generateToken");
const asyncHandler = require("../utils/asynchandler");
const AppError = require("../utils/AppError.utils");
const { verifyGoogleToken } = require("../utils/googleAuth");


const getPublicUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isSuspended: user.isSuspended,
    profileImage: user.profileImage || "",
    profilePicture: user.profilePicture || "",
    freelancerRating: user.freelancerRating,
    freelancerReviewCount: user.freelancerReviewCount,
    clientRating: user.clientRating,
    clientReviewCount: user.clientReviewCount,
    freelancerCompletedProjects: user.freelancerCompletedProjects,
    clientCompletedProjects: user.clientCompletedProjects
});

const registerUser = asyncHandler(async (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { name, email, password, role, secretCode } = req.body;

    let allowedRole = "client";

    if (role === "freelancer") {
        allowedRole = "freelancer";
    }

    if (role === "admin") {
        if (secretCode !== process.env.ADMIN_SECRET) {
            return res.status(403).json({
                success: false,
                message: "Invalid admin secret"
            });
        }

        allowedRole = "admin";
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "User already exists"
        });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: allowedRole
    });

    const tokens = generateTokenPair(user._id, user.role);

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
            ...tokens,
            user: getPublicUser(user)
        }
    });
});

const getMe = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    res.status(200).json({
        success: true,
        data: {
            user: getPublicUser(user)
        }
    });
});

const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError("Invalid credentials", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new AppError("Invalid credentials", 401);
    }

    if (user.isSuspended) {
        return res.status(403).json({
            success: false,
            message: "Your account has been suspended"
        });
    }

    const tokens = generateTokenPair(user._id, user.role);

    res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            ...tokens,
            user: getPublicUser(user)
        }
    });
});

const refreshAuthTokens = asyncHandler(async (req, res) => {
    const decoded = jwt.verify(
        req.body.refreshToken,
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== "refresh") {
        return res.status(401).json({
            success: false,
            message: "Invalid refresh token"
        });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "User no longer exists"
        });
    }

    if (user.isSuspended) {
        return res.status(403).json({
            success: false,
            message: "Your account has been suspended"
        });
    }

    res.status(200).json({
        success: true,
        data: {
            ...generateTokenPair(user._id, user.role),
            user: getPublicUser(user)
        }
    });
});

const googleLoginController = asyncHandler(async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({
            success: false,
            message: "Google credential token is required"
        });
    }

    // Verify token
    const googleUser = await verifyGoogleToken(credential);

    // Find existing user by email
    let user = await User.findOne({ email: googleUser.email });

    if (user) {
        let isModified = false;
        
        if (user.authProvider !== "google") {
            user.authProvider = "google";
            isModified = true;
        }
        if (!user.googleId) {
            user.googleId = googleUser.googleId;
            isModified = true;
        }
        
        // Preserve existing profile image / picture (only set if not already present)
        if (!user.profilePicture) {
            user.profilePicture = googleUser.picture;
            isModified = true;
        }
        if (!user.profileImage) {
            user.profileImage = googleUser.picture;
            isModified = true;
        }

        if (isModified) {
            await user.save();
        }
        
        if (user.isSuspended) {
            return res.status(403).json({
                success: false,
                message: "Your account has been suspended"
            });
        }
    } else {
        // Create new user (preserves existing roles, defaults role to "client")
        user = await User.create({
            name: googleUser.name,
            email: googleUser.email,
            profilePicture: googleUser.picture,
            profileImage: googleUser.picture,
            authProvider: "google",
            googleId: googleUser.googleId,
            role: "client"
        });
    }

    // Generate JWT access & refresh tokens
    const tokens = generateTokenPair(user._id, user.role);

    res.status(200).json({
        success: true,
        message: "Google login successful",
        data: {
            ...tokens,
            user: getPublicUser(user)
        }
    });
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
    refreshAuthTokens,
    googleLoginController
};
