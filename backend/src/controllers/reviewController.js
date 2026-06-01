const Review = require("../models/Review");
const Project = require("../models/Project.models");
const User = require("../models/user.models");
const asyncHandler = require("../utils/asynchandler");

// POST /api/reviews
const createReview = asyncHandler(async (req, res) => {
    const { projectId, ratings, comment } = req.body;

    if (!projectId || !ratings) {
        return res.status(400).json({
            success: false,
            message: "Project ID and ratings are required"
        });
    }

    const { communication, quality, timeliness, professionalism } = ratings;

    if (!communication || !quality || !timeliness || !professionalism) {
        return res.status(400).json({
            success: false,
            message: "All rating categories (communication, quality, timeliness, professionalism) are required"
        });
    }

    // Validate project exists and is completed
    const project = await Project.findById(projectId);

    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found"
        });
    }

    if (project.status !== "completed") {
        return res.status(400).json({
            success: false,
            message: "Reviews can only be submitted for completed projects"
        });
    }

    // Validate reviewer is a participant
    const userId = req.user._id.toString();
    const isClient = project.client.toString() === userId;
    const isFreelancer = project.freelancer.toString() === userId;

    if (!isClient && !isFreelancer) {
        return res.status(403).json({
            success: false,
            message: "You are not a participant of this project"
        });
    }

    // Set reviewee to the other participant
    const revieweeId = isClient ? project.freelancer : project.client;

    // Check if user has already reviewed this project
    const existingReview = await Review.findOne({
        project: projectId,
        reviewer: req.user._id
    });

    if (existingReview) {
        return res.status(400).json({
            success: false,
            message: "You have already reviewed this project"
        });
    }

    // Calculate overall rating as average of 4 categories
    const overallRating = parseFloat(
        ((communication + quality + timeliness + professionalism) / 4).toFixed(2)
    );

    // Create the review
    const review = await Review.create({
        project: projectId,
        reviewer: req.user._id,
        reviewee: revieweeId,
        ratings: { communication, quality, timeliness, professionalism },
        overallRating,
        comment: comment || ""
    });

    // Update reviewee's user document
    const reviewee = await User.findById(revieweeId);
    reviewee.totalReviews = (reviewee.totalReviews || 0) + 1;
    reviewee.totalRatingPoints = (reviewee.totalRatingPoints || 0) + overallRating;
    reviewee.averageRating = parseFloat(
        (reviewee.totalRatingPoints / reviewee.totalReviews).toFixed(2)
    );
    await reviewee.save();

    // Populate the review for response
    const populatedReview = await Review.findById(review._id)
        .populate("reviewer", "name profileImage")
        .populate("reviewee", "name profileImage")
        .populate("project", "title");

    // Emit socket event to both participants
    const io = req.app.get("io");
    if (io) {
        const clientId = project.client.toString();
        const freelancerId = project.freelancer.toString();

        io.to(`user:${clientId}`).emit("review_created", {
            review: populatedReview
        });
        io.to(`user:${freelancerId}`).emit("review_created", {
            review: populatedReview
        });
    }

    res.status(201).json({
        success: true,
        message: "Review submitted successfully",
        data: { review: populatedReview }
    });
});

// GET /api/reviews/project/:projectId
const getProjectReviews = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found"
        });
    }

    // Validate user is a participant
    const userId = req.user._id.toString();
    const isClient = project.client.toString() === userId;
    const isFreelancer = project.freelancer.toString() === userId;

    if (!isClient && !isFreelancer) {
        return res.status(403).json({
            success: false,
            message: "You do not have access to this project's reviews"
        });
    }

    const reviews = await Review.find({ project: projectId })
        .populate("reviewer", "name profileImage")
        .populate("reviewee", "name profileImage")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: { reviews }
    });
});

// GET /api/reviews/user/:userId
const getUserReviews = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const reviews = await Review.find({ reviewee: userId })
        .populate("reviewer", "name profileImage")
        .populate("project", "title")
        .sort({ createdAt: -1 });

    const user = await User.findById(userId).select("name averageRating totalReviews");

    res.status(200).json({
        success: true,
        data: {
            reviews,
            userStats: user
                ? {
                      name: user.name,
                      averageRating: user.averageRating,
                      totalReviews: user.totalReviews
                  }
                : null
        }
    });
});

// GET /api/reviews/status/:projectId
const getReviewStatus = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found"
        });
    }

    const userId = req.user._id.toString();
    const isClient = project.client.toString() === userId;
    const isFreelancer = project.freelancer.toString() === userId;
    const isParticipant = isClient || isFreelancer;
    const isCompleted = project.status === "completed";

    const existingReview = await Review.findOne({
        project: projectId,
        reviewer: req.user._id
    });

    res.status(200).json({
        success: true,
        data: {
            hasReviewed: !!existingReview,
            canReview: isCompleted && isParticipant && !existingReview
        }
    });
});

module.exports = {
    createReview,
    getProjectReviews,
    getUserReviews,
    getReviewStatus
};
