const Deliverable = require("../models/Deliverable");
const Milestone = require("../models/Milestone");
const Project = require("../models/Project.models");
const asyncHandler = require("../utils/asynchandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { enrichMilestone } = require("./milestoneController");

// Helper to recalculate project progress percentage
const recalculateProjectProgress = async (projectId, req) => {
    const project = await Project.findById(projectId);
    if (!project) return null;

    const milestones = await Milestone.find({ project: projectId });
    const total = milestones.length;
    let progressPercentage = 0;

    if (total > 0) {
        const approvedCount = milestones.filter(m => m.status === "approved").length;
        progressPercentage = Math.round((approvedCount / total) * 100);
    }

    project.progressPercentage = progressPercentage;
    await project.save();

    const io = req.app.get("io");
    if (io) {
        io.to(`user:${project.client}`).emit("project_progress_updated", { projectId, progressPercentage });
        io.to(`user:${project.freelancer}`).emit("project_progress_updated", { projectId, progressPercentage });
    }

    return project;
};

// @desc    Submit deliverables for a milestone
// @route   POST /api/deliverables/:milestoneId/submit
// @access  Private (Freelancer only)
const submitDeliverables = asyncHandler(async (req, res) => {
    const { milestoneId } = req.params;
    const { notes } = req.body;
    const userId = req.user._id;

    // Validate milestone exists
    const milestone = await Milestone.findById(milestoneId).populate("project");
    if (!milestone) {
        return errorResponse(res, "Milestone not found", 404);
    }

    const project = milestone.project;

    // Only freelancer can submit
    if (project.freelancer.toString() !== userId.toString()) {
        return errorResponse(res, "Only the assigned freelancer can submit deliverables", 403);
    }

    // Milestone must be in_progress or overdue to submit
    if (!["in_progress", "overdue", "rejected"].includes(milestone.status)) {
        return errorResponse(
            res,
            `Cannot submit deliverables for a milestone with status "${milestone.status}". Milestone must be in progress, overdue, or rejected.`,
            400
        );
    }

    // Project must be active
    if (["completed", "cancelled"].includes(project.status)) {
        return errorResponse(res, `Cannot submit deliverables on a ${project.status} project`, 400);
    }

    // Validate files were uploaded
    if (!req.files || req.files.length === 0) {
        return errorResponse(res, "At least one file is required for submission", 400);
    }

    // Determine version number
    const latestDeliverable = await Deliverable.findOne({ milestone: milestoneId })
        .sort({ version: -1 })
        .select("version");
    const nextVersion = latestDeliverable ? latestDeliverable.version + 1 : 1;

    // Build file objects from multer/cloudinary upload
    const files = req.files.map((file) => ({
        url: file.path || file.secure_url || file.url,
        publicId: file.filename || file.public_id || null,
        fileName: file.originalname || file.original_filename || "file",
        fileType: file.mimetype || "application/octet-stream",
        fileSize: file.size || 0,
        resourceType: file.mimetype?.startsWith("image/") ? "image" : "raw"
    }));

    // Create deliverable
    const deliverable = await Deliverable.create({
        milestone: milestoneId,
        project: project._id,
        submittedBy: userId,
        files,
        notes: notes || "",
        version: nextVersion,
        status: "submitted"
    });

    // Update milestone status to "submitted"
    milestone.status = "submitted";
    milestone.submittedAt = new Date();
    await milestone.save();

    await recalculateProjectProgress(project._id, req);

    // Populate for response
    await deliverable.populate("submittedBy", "name profileImage profilePicture");

    const enrichedMilestone = enrichMilestone(milestone);

    // Emit socket events
    const io = req.app.get("io");
    if (io) {
        const deliverablePayload = {
            deliverable: deliverable.toObject(),
            milestone: enrichedMilestone,
            projectId: project._id
        };

        // Notify client about new submission
        io.to(`user:${project.client}`).emit("deliverable_submitted", deliverablePayload);
        // Confirm to freelancer
        io.to(`user:${project.freelancer}`).emit("deliverable_submitted", deliverablePayload);

        // Also emit milestone status change
        io.to(`user:${project.client}`).emit("milestone_status_changed", { milestone: enrichedMilestone });
        io.to(`user:${project.freelancer}`).emit("milestone_status_changed", { milestone: enrichedMilestone });
    }

    return successResponse(res, {
        deliverable: deliverable.toObject(),
        milestone: enrichedMilestone
    }, "Deliverables submitted successfully", 201);
});

// @desc    Get all deliverables for a milestone (version history)
// @route   GET /api/deliverables/:milestoneId
// @access  Private (Client & Freelancer)
const getDeliverables = asyncHandler(async (req, res) => {
    const { milestoneId } = req.params;
    const userId = req.user._id;

    const milestone = await Milestone.findById(milestoneId).populate("project");
    if (!milestone) {
        return errorResponse(res, "Milestone not found", 404);
    }

    const project = milestone.project;

    // Verify ownership
    if (
        project.client.toString() !== userId.toString() &&
        project.freelancer.toString() !== userId.toString()
    ) {
        return errorResponse(res, "You are not authorized to view these deliverables", 403);
    }

    const deliverables = await Deliverable.find({ milestone: milestoneId })
        .populate("submittedBy", "name profileImage profilePicture")
        .populate("reviewedBy", "name profileImage profilePicture")
        .sort({ version: -1 });

    return successResponse(res, {
        deliverables,
        totalVersions: deliverables.length,
        milestoneId,
        milestoneStatus: milestone.status
    });
});

// @desc    Get single deliverable by ID
// @route   GET /api/deliverables/detail/:deliverableId
// @access  Private (Client & Freelancer)
const getDeliverableById = asyncHandler(async (req, res) => {
    const { deliverableId } = req.params;
    const userId = req.user._id;

    const deliverable = await Deliverable.findById(deliverableId)
        .populate("submittedBy", "name profileImage profilePicture")
        .populate("reviewedBy", "name profileImage profilePicture")
        .populate({
            path: "milestone",
            populate: { path: "project", select: "client freelancer title status" }
        });

    if (!deliverable) {
        return errorResponse(res, "Deliverable not found", 404);
    }

    const project = deliverable.milestone.project;

    // Verify ownership
    if (
        project.client.toString() !== userId.toString() &&
        project.freelancer.toString() !== userId.toString()
    ) {
        return errorResponse(res, "You are not authorized to view this deliverable", 403);
    }

    return successResponse(res, { deliverable });
});

// @desc    Review a deliverable (approve or reject)
// @route   PATCH /api/deliverables/:deliverableId/review
// @access  Private (Client only)
const reviewDeliverable = asyncHandler(async (req, res) => {
    const { deliverableId } = req.params;
    const { action, feedback } = req.body;
    const userId = req.user._id;

    if (!["approve", "reject"].includes(action)) {
        return errorResponse(res, "Action must be 'approve' or 'reject'", 400);
    }

    const deliverable = await Deliverable.findById(deliverableId);
    if (!deliverable) {
        return errorResponse(res, "Deliverable not found", 404);
    }

    if (deliverable.status !== "submitted") {
        return errorResponse(res, `This deliverable has already been ${deliverable.status}`, 400);
    }

    const milestone = await Milestone.findById(deliverable.milestone).populate("project");
    if (!milestone) {
        return errorResponse(res, "Associated milestone not found", 404);
    }

    const project = milestone.project;

    // Only client can review
    if (project.client.toString() !== userId.toString()) {
        return errorResponse(res, "Only the client can review deliverables", 403);
    }

    // Project must be active
    if (["completed", "cancelled"].includes(project.status)) {
        return errorResponse(res, `Cannot review deliverables on a ${project.status} project`, 400);
    }

    if (action === "approve") {
        deliverable.status = "approved";
        deliverable.reviewedBy = userId;
        deliverable.reviewedAt = new Date();
        deliverable.reviewFeedback = feedback || "";
        await deliverable.save();

        // Update milestone to approved
        milestone.status = "approved";
        milestone.approvedAt = new Date();
        milestone.isLocked = true;
        await milestone.save();

        await recalculateProjectProgress(project._id, req);

    } else {
        // Reject
        if (!feedback || feedback.trim() === "") {
            return errorResponse(res, "Feedback is required when rejecting deliverables", 400);
        }

        deliverable.status = "rejected";
        deliverable.reviewedBy = userId;
        deliverable.reviewedAt = new Date();
        deliverable.reviewFeedback = feedback;
        await deliverable.save();

        // Move milestone back to "rejected" so freelancer can resubmit
        milestone.status = "rejected";
        milestone.submittedAt = null;
        await milestone.save();
    }

    // Populate for response
    await deliverable.populate("submittedBy", "name profileImage profilePicture");
    await deliverable.populate("reviewedBy", "name profileImage profilePicture");

    const enrichedMilestone = enrichMilestone(milestone);

    // Emit socket events
    const io = req.app.get("io");
    if (io) {
        const reviewPayload = {
            deliverable: deliverable.toObject(),
            milestone: enrichedMilestone,
            projectId: project._id,
            action
        };

        io.to(`user:${project.client}`).emit("deliverable_reviewed", reviewPayload);
        io.to(`user:${project.freelancer}`).emit("deliverable_reviewed", reviewPayload);

        io.to(`user:${project.client}`).emit("milestone_status_changed", { milestone: enrichedMilestone });
        io.to(`user:${project.freelancer}`).emit("milestone_status_changed", { milestone: enrichedMilestone });
    }

    const statusMessage = action === "approve"
        ? "Deliverable approved and milestone completed"
        : "Deliverable rejected. Freelancer can resubmit.";

    return successResponse(res, {
        deliverable: deliverable.toObject(),
        milestone: enrichedMilestone
    }, statusMessage);
});

module.exports = {
    submitDeliverables,
    getDeliverables,
    getDeliverableById,
    reviewDeliverable
};
