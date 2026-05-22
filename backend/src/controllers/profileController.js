const FreelancerProfile = require("../models/FreelancerProfile.models");
const asyncHandler = require("../utils/asynchandler");

// @desc    Get current user's profile
// @route   GET /api/profile/me
// @access  Private (freelancer)
const getMyProfile = asyncHandler(async (req, res) => {
    const profile = await FreelancerProfile.findOne({ user: req.user._id })
        .populate("user", "name email role");

    if (!profile) {
        return res.status(404).json({
            success: false,
            message: "Profile not found. Create one first."
        });
    }

    res.status(200).json({
        success: true,
        data: { profile }
    });
});

// @desc    Get profile by user ID (public)
// @route   GET /api/profile/user/:userId
// @access  Public
const getProfileByUserId = asyncHandler(async (req, res) => {
    const profile = await FreelancerProfile.findOne({ user: req.params.userId })
        .populate("user", "name email");

    if (!profile) {
        return res.status(404).json({
            success: false,
            message: "Profile not found"
        });
    }

    res.status(200).json({
        success: true,
        data: { profile }
    });
});

// @desc    Create or update profile
// @route   PUT /api/profile
// @access  Private (freelancer)
const createOrUpdateProfile = asyncHandler(async (req, res) => {
    const {
        title,
        bio,
        skills,
        hourlyRate,
        availability,
        location,
        experience
    } = req.body;

    const profileFields = {
        user: req.user._id,
        ...(title !== undefined && { title }),
        ...(bio !== undefined && { bio }),
        ...(skills !== undefined && { skills }),
        ...(hourlyRate !== undefined && { hourlyRate }),
        ...(availability !== undefined && { availability }),
        ...(location !== undefined && { location }),
        ...(experience !== undefined && { experience })
    };

    let profile = await FreelancerProfile.findOne({ user: req.user._id });

    if (profile) {
        // Update
        profile = await FreelancerProfile.findOneAndUpdate(
            { user: req.user._id },
            { $set: profileFields },
            { new: true, runValidators: true }
        ).populate("user", "name email role");
    } else {
        // Create
        profile = await FreelancerProfile.create(profileFields);
        profile = await profile.populate("user", "name email role");
    }

    // Recalculate completion score
    profile.calculateCompletion();
    await profile.save();

    res.status(200).json({
        success: true,
        message: profile ? "Profile updated" : "Profile created",
        data: { profile }
    });
});

// @desc    Upload profile image
// @route   POST /api/profile/image
// @access  Private (freelancer)
const uploadProfileImageHandler = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No image file provided"
        });
    }

    let profile = await FreelancerProfile.findOne({ user: req.user._id });

    if (!profile) {
        profile = await FreelancerProfile.create({
            user: req.user._id,
            profileImage: req.file.path
        });
    } else {
        profile.profileImage = req.file.path;
        profile.calculateCompletion();
        await profile.save();
    }

    res.status(200).json({
        success: true,
        message: "Profile image uploaded",
        data: { imageUrl: req.file.path }
    });
});

// @desc    Upload resume
// @route   POST /api/profile/resume
// @access  Private (freelancer)
const uploadResumeHandler = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No resume file provided"
        });
    }

    let profile = await FreelancerProfile.findOne({ user: req.user._id });

    if (!profile) {
        profile = await FreelancerProfile.create({
            user: req.user._id,
            resume: req.file.path
        });
    } else {
        profile.resume = req.file.path;
        profile.calculateCompletion();
        await profile.save();
    }

    res.status(200).json({
        success: true,
        message: "Resume uploaded",
        data: { resumeUrl: req.file.path }
    });
});

// @desc    Add portfolio item
// @route   POST /api/profile/portfolio
// @access  Private (freelancer)
const addPortfolioItem = asyncHandler(async (req, res) => {
    const { title, description, projectUrl } = req.body;

    if (!title) {
        return res.status(400).json({
            success: false,
            message: "Portfolio title is required"
        });
    }

    let profile = await FreelancerProfile.findOne({ user: req.user._id });

    if (!profile) {
        return res.status(404).json({
            success: false,
            message: "Profile not found. Create a profile first."
        });
    }

    const newItem = {
        title,
        description: description || "",
        imageUrl: req.file ? req.file.path : "",
        projectUrl: projectUrl || ""
    };

    profile.portfolio.push(newItem);
    profile.calculateCompletion();
    await profile.save();

    res.status(201).json({
        success: true,
        message: "Portfolio item added",
        data: { portfolio: profile.portfolio }
    });
});

// @desc    Remove portfolio item
// @route   DELETE /api/profile/portfolio/:itemId
// @access  Private (freelancer)
const removePortfolioItem = asyncHandler(async (req, res) => {
    const profile = await FreelancerProfile.findOne({ user: req.user._id });

    if (!profile) {
        return res.status(404).json({
            success: false,
            message: "Profile not found"
        });
    }

    const itemIndex = profile.portfolio.findIndex(
        (item) => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: "Portfolio item not found"
        });
    }

    profile.portfolio.splice(itemIndex, 1);
    profile.calculateCompletion();
    await profile.save();

    res.status(200).json({
        success: true,
        message: "Portfolio item removed",
        data: { portfolio: profile.portfolio }
    });
});

module.exports = {
    getMyProfile,
    getProfileByUserId,
    createOrUpdateProfile,
    uploadProfileImageHandler,
    uploadResumeHandler,
    addPortfolioItem,
    removePortfolioItem
};
