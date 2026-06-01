const Project = require("../models/Project.models");
const Conversation = require("../models/Conversation");
const Gig = require("../models/Gig.models");
const Milestone = require("../models/Milestone");
const { checkAndUpdateOverdueMilestones } = require("./milestoneController");
const asyncHandler = require("../utils/asynchandler");
const { enrichConversation } = require("../services/chatReadService");

// Socket helper to emit project updates
const emitProjectUpdate = (req, project) => {
    const io = req.app.get("io");
    if (!io) return;

    const freelancerId = project.freelancer?._id || project.freelancer;
    const clientId = project.client?._id || project.client;

    if (freelancerId) {
        io.to(`user:${freelancerId}`).emit("project_updated", { project });
    }
    if (clientId) {
        io.to(`user:${clientId}`).emit("project_updated", { project });
    }
};

// GET /api/projects
const getUserProjects = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const projects = await Project.find({
        $or: [
            { client: userId },
            { freelancer: userId }
        ]
    })
    .populate("gig", "title category experienceLevel budgetMin budgetMax status gigStatus")
    .populate("client", "name email profileImage averageRating totalReviews")
    .populate("freelancer", "name email profileImage averageRating totalReviews")
    .sort({ updatedAt: -1 });

    const projectIds = projects.map(p => p._id);
    if (projectIds.length > 0) {
        await checkAndUpdateOverdueMilestones(projectIds, req);
    }

    const projectsWithOverdue = await Milestone.distinct("project", {
        project: { $in: projectIds },
        status: "overdue"
    });
    const overdueSet = new Set(projectsWithOverdue.map(id => id.toString()));

    const enrichedProjects = projects.map(project => {
        const projObj = project.toObject();
        projObj.isAtRisk = overdueSet.has(projObj._id.toString());
        return projObj;
    });

    res.status(200).json({
        success: true,
        data: { projects: enrichedProjects }
    });
});

// GET /api/projects/:id
const getProjectById = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
        .populate("gig")
        .populate("proposal", "coverLetter bidAmount estimatedDays status")
        .populate("client", "name email profileImage averageRating totalReviews")
        .populate("freelancer", "name email profileImage averageRating totalReviews");

    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found"
        });
    }

    const userId = req.user._id.toString();
    if (project.client._id.toString() !== userId && project.freelancer._id.toString() !== userId) {
        return res.status(403).json({
            success: false,
            message: "You do not have access to this project"
        });
    }

    // Find the linked conversation
    const conversation = await Conversation.findOne({ proposalId: project.proposal._id })
        .populate("participants", "name email profileImage profilePicture role");

    const enrichedConversation = conversation ? enrichConversation(conversation, req.user._id) : null;

    res.status(200).json({
        success: true,
        data: { project, conversation: enrichedConversation }
    });
});

// PATCH /api/projects/:id
const updateProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found"
        });
    }

    const userId = req.user._id.toString();
    const isClient = project.client.toString() === userId;
    const isFreelancer = project.freelancer.toString() === userId;

    if (!isClient && !isFreelancer) {
        return res.status(403).json({
            success: false,
            message: "You do not have access to modify this project"
        });
    }

    const { status, expectedCompletionDate } = req.body;

    // Apply updates based on roles
    if (isFreelancer) {
        // Freelancers can request revision or transition to in_progress
        if (status && ["in_progress", "revision"].includes(status)) {
            project.status = status;
        }
    }

    if (isClient) {
        if (status && ["active", "in_progress", "revision", "completed", "cancelled", "paused"].includes(status)) {
            project.status = status;
            if (status === "completed") {
                project.completedAt = new Date();
                project.progressPercentage = 100;
            } else {
                project.completedAt = null;
            }
        }

        if (expectedCompletionDate !== undefined) {
            project.expectedCompletionDate = expectedCompletionDate;
        }
    }

    await project.save();

    // Populate and emit updates
    const updatedProject = await Project.findById(project._id)
        .populate("gig")
        .populate("client", "name email profileImage averageRating totalReviews")
        .populate("freelancer", "name email profileImage averageRating totalReviews");

    // Sync Gig Status if project completed
    if (status === "completed" || status === "cancelled") {
        const gig = await Gig.findById(project.gig);
        if (gig) {
            gig.gigStatus = status === "completed" ? "completed" : "closed";
            await gig.save();
        }
    }

    emitProjectUpdate(req, updatedProject);

    res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: { project: updatedProject }
    });
});

module.exports = {
    getUserProjects,
    getProjectById,
    updateProject
};
