const Review = require("../models/Review");
const Project = require("../models/Project.models");
const User = require("../models/user.models");
const asyncHandler = require("../utils/asynchandler");

// Rating category definitions per review type
const CLIENT_TO_FREELANCER_CATEGORIES = ["communication", "qualityOfWork", "timeliness", "professionalism"];
const FREELANCER_TO_CLIENT_CATEGORIES = ["communication", "requirementClarity", "responsiveness", "professionalism"];

// POST /api/reviews
const createReview = asyncHandler(async (req, res) => {
    const { projectId, ratings, comment } = req.body;

    if (!projectId || !ratings) {
        return res.status(400).json({
            success: false,
            message: "Project ID and ratings are required"
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

    // Determine review type and reviewee based on reviewer role
    const reviewType = isClient ? "client_to_freelancer" : "freelancer_to_client";
    const revieweeId = isClient ? project.freelancer : project.client;

    // Check duplicate: one review per reviewer per project
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

    // Validate role-specific rating categories
    const requiredCategories = isClient
        ? CLIENT_TO_FREELANCER_CATEGORIES
        : FREELANCER_TO_CLIENT_CATEGORIES;

    for (const cat of requiredCategories) {
        if (!ratings[cat] || ratings[cat] < 1 || ratings[cat] > 5) {
            return res.status(400).json({
                success: false,
                message: `Rating for "${cat}" is required and must be between 1 and 5`
            });
        }
    }

    // Calculate overall rating from the 4 role-specific categories
    const categorySum = requiredCategories.reduce((sum, cat) => sum + ratings[cat], 0);
    const overallRating = parseFloat((categorySum / 4).toFixed(2));

    // Build the ratings object with only the relevant categories
    const ratingsToStore = {};
    for (const cat of requiredCategories) {
        ratingsToStore[cat] = ratings[cat];
    }

    // Create the review
    const review = await Review.create({
        project: projectId,
        reviewer: req.user._id,
        reviewee: revieweeId,
        reviewType,
        ratings: ratingsToStore,
        overallRating,
        comment: comment || ""
    });

    // Update reviewee's role-specific reputation (BUG 4 fix: never merge)
    const reviewee = await User.findById(revieweeId);

    if (reviewType === "client_to_freelancer") {
        // Client reviewing freelancer → update freelancer reputation
        reviewee.freelancerReviewCount = (reviewee.freelancerReviewCount || 0) + 1;
        reviewee.freelancerTotalRatingPoints = (reviewee.freelancerTotalRatingPoints || 0) + overallRating;
        reviewee.freelancerRating = parseFloat(
            (reviewee.freelancerTotalRatingPoints / reviewee.freelancerReviewCount).toFixed(2)
        );
    } else {
        // Freelancer reviewing client → update client reputation
        reviewee.clientReviewCount = (reviewee.clientReviewCount || 0) + 1;
        reviewee.clientTotalRatingPoints = (reviewee.clientTotalRatingPoints || 0) + overallRating;
        reviewee.clientRating = parseFloat(
            (reviewee.clientTotalRatingPoints / reviewee.clientReviewCount).toFixed(2)
        );
    }

    await reviewee.save();

    // Populate the review for response
    const populatedReview = await Review.findById(review._id)
        .populate("reviewer", "name profileImage role freelancerRating freelancerReviewCount clientRating clientReviewCount freelancerCompletedProjects clientCompletedProjects")
        .populate("reviewee", "name profileImage role freelancerRating freelancerReviewCount clientRating clientReviewCount freelancerCompletedProjects clientCompletedProjects")
        .populate("project", "title");

    // Emit socket event to both participants
    const io = req.app.get("io");
    if (io) {
        const clientId = project.client.toString();
        const freelancerId = project.freelancer.toString();

        const payload = {
            review: populatedReview,
            reviewType,
            projectName: populatedReview.project?.title || "",
            overallRating
        };

        io.to(`user:${clientId}`).emit("review_created", payload);
        io.to(`user:${freelancerId}`).emit("review_created", payload);
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

    const reviews = await Review.find({ project: projectId, isHidden: { $ne: true } })
        .populate("reviewer", "name profileImage role freelancerRating freelancerReviewCount clientRating clientReviewCount freelancerCompletedProjects clientCompletedProjects")
        .populate("reviewee", "name profileImage role freelancerRating freelancerReviewCount clientRating clientReviewCount freelancerCompletedProjects clientCompletedProjects")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: { reviews }
    });
});

// GET /api/reviews/user/:userId
const getUserReviews = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const reviews = await Review.find({ reviewee: userId, isHidden: { $ne: true } })
        .populate("reviewer", "name profileImage role freelancerRating freelancerReviewCount clientRating clientReviewCount freelancerCompletedProjects clientCompletedProjects")
        .populate("project", "title")
        .sort({ createdAt: -1 });

    const user = await User.findById(userId).select(
        "name freelancerRating freelancerReviewCount clientRating clientReviewCount freelancerCompletedProjects clientCompletedProjects"
    );

    res.status(200).json({
        success: true,
        data: {
            reviews,
            userStats: user
                ? {
                      name: user.name,
                      freelancerRating: user.freelancerRating,
                      freelancerReviewCount: user.freelancerReviewCount,
                      clientRating: user.clientRating,
                      clientReviewCount: user.clientReviewCount,
                      freelancerCompletedProjects: user.freelancerCompletedProjects,
                      clientCompletedProjects: user.clientCompletedProjects
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
            canReview: isCompleted && isParticipant && !existingReview,
            reviewerRole: isClient ? "client" : "freelancer"
        }
    });
});

module.exports = {
    createReview,
    getProjectReviews,
    getUserReviews,
    getReviewStatus
};
