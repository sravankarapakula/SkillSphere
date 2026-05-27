const Project = require("../models/Project.models");
const Milestone = require("../models/Milestone");
const asyncHandler = require("../utils/asynchandler");

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

// @desc    Create a milestone
// @route   POST /api/milestones
// @access  Private (Client Only)
const createMilestone = asyncHandler(async (req, res) => {
    const { projectId, title, description, amount, dueDate } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found"
        });
    }

    // Check client ownership
    if (project.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Only the client can create milestones"
        });
    }

    if (["completed", "cancelled"].includes(project.status)) {
        return res.status(400).json({
            success: false,
            message: `Cannot create milestones on a ${project.status} project`
        });
    }

    // Budget validation
    const milestones = await Milestone.find({ project: projectId });
    const allocatedBudget = milestones.reduce((sum, m) => sum + m.amount, 0);
    if (allocatedBudget + Number(amount) > project.agreedAmount) {
        const remainingBudget = project.agreedAmount - allocatedBudget;
        return res.status(400).json({
            success: false,
            message: `Milestone amounts exceed project budget of $${project.agreedAmount}. Remaining budget: $${remainingBudget}`
        });
    }

    const order = milestones.length;

    const milestone = await Milestone.create({
        project: projectId,
        title,
        description,
        amount: Number(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        order,
        createdBy: req.user._id
    });

    await recalculateProjectProgress(projectId, req);

    const io = req.app.get("io");
    if (io) {
        io.to(`user:${project.client}`).emit("milestone_created", { milestone });
        io.to(`user:${project.freelancer}`).emit("milestone_created", { milestone });
    }

    res.status(201).json({
        success: true,
        message: "Milestone created successfully",
        data: { milestone }
    });
});

// @desc    Get all milestones for a project
// @route   GET /api/milestones/project/:projectId
// @access  Private (Client & Freelancer)
const getProjectMilestones = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found"
        });
    }

    // Ownership check (client or freelancer)
    if (project.client.toString() !== req.user._id.toString() && project.freelancer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to view this project's milestones"
        });
    }

    const milestones = await Milestone.find({ project: projectId }).sort({ order: 1, createdAt: 1 });

    const totalBudget = project.agreedAmount;
    const allocatedBudget = milestones.reduce((sum, m) => sum + m.amount, 0);
    const remainingBudget = totalBudget - allocatedBudget;

    res.status(200).json({
        success: true,
        data: {
            milestones,
            budgetInfo: {
                totalBudget,
                allocatedBudget,
                remainingBudget
            }
        }
    });
});

// @desc    Update a milestone
// @route   PUT /api/milestones/:id
// @access  Private (Client Only)
const updateMilestone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, amount, dueDate } = req.body;

    const milestone = await Milestone.findById(id).populate("project");
    if (!milestone) {
        return res.status(404).json({
            success: false,
            message: "Milestone not found"
        });
    }

    const project = milestone.project;

    // Validate client ownership
    if (project.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Only the client can update milestones"
        });
    }

    // Only allow editing milestones in 'pending' status
    if (milestone.status !== "pending") {
        return res.status(400).json({
            success: false,
            message: "Only pending milestones can be updated"
        });
    }

    // Budget validation if amount changes
    if (amount !== undefined && Number(amount) !== milestone.amount) {
        const milestones = await Milestone.find({ project: project._id, _id: { $ne: id } });
        const allocatedBudget = milestones.reduce((sum, m) => sum + m.amount, 0);
        if (allocatedBudget + Number(amount) > project.agreedAmount) {
            const remainingBudget = project.agreedAmount - allocatedBudget;
            return res.status(400).json({
                success: false,
                message: `Milestone amounts exceed project budget of $${project.agreedAmount}. Remaining budget: $${remainingBudget}`
            });
        }
        milestone.amount = Number(amount);
    }

    if (title !== undefined) milestone.title = title;
    if (description !== undefined) milestone.description = description;
    if (dueDate !== undefined) milestone.dueDate = dueDate ? new Date(dueDate) : null;

    await milestone.save();

    await recalculateProjectProgress(project._id, req);

    const io = req.app.get("io");
    if (io) {
        io.to(`user:${project.client}`).emit("milestone_updated", { milestone });
        io.to(`user:${project.freelancer}`).emit("milestone_updated", { milestone });
    }

    res.status(200).json({
        success: true,
        message: "Milestone updated successfully",
        data: { milestone }
    });
});

// @desc    Delete a milestone
// @route   DELETE /api/milestones/:id
// @access  Private (Client Only)
const deleteMilestone = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const milestone = await Milestone.findById(id).populate("project");
    if (!milestone) {
        return res.status(404).json({
            success: false,
            message: "Milestone not found"
        });
    }

    const project = milestone.project;

    // Validate client ownership
    if (project.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Only the client can delete milestones"
        });
    }

    // Only allow deleting milestones in 'pending' status
    if (milestone.status !== "pending") {
        return res.status(400).json({
            success: false,
            message: "Only pending milestones can be deleted"
        });
    }

    await Milestone.deleteOne({ _id: id });

    await recalculateProjectProgress(project._id, req);

    const io = req.app.get("io");
    if (io) {
        io.to(`user:${project.client}`).emit("milestone_deleted", { milestoneId: id, projectId: project._id });
        io.to(`user:${project.freelancer}`).emit("milestone_deleted", { milestoneId: id, projectId: project._id });
    }

    res.status(200).json({
        success: true,
        message: "Milestone deleted successfully",
        data: { milestoneId: id, projectId: project._id }
    });
});

// @desc    Update milestone status
// @route   PATCH /api/milestones/:id/status
// @access  Private (Client & Freelancer)
const updateMilestoneStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const milestone = await Milestone.findById(id).populate("project");
    if (!milestone) {
        return res.status(404).json({
            success: false,
            message: "Milestone not found"
        });
    }

    const project = milestone.project;
    const userIdStr = req.user._id.toString();
    const isClient = project.client.toString() === userIdStr;
    const isFreelancer = project.freelancer.toString() === userIdStr;

    // Validate ownership
    if (!isClient && !isFreelancer) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to update this milestone status"
        });
    }

    const currentStatus = milestone.status;

    // Approved milestones are locked
    if (currentStatus === "approved") {
        return res.status(400).json({
            success: false,
            message: "Approved milestones are locked and cannot be changed"
        });
    }

    // Check transition validity
    if (status === "in_progress") {
        if (currentStatus !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Only pending milestones can start work (move to in_progress)"
            });
        }
        if (!isFreelancer) {
            return res.status(403).json({
                success: false,
                message: "Only the freelancer can start work on a milestone"
            });
        }
    } else if (status === "submitted") {
        if (currentStatus !== "in_progress") {
            return res.status(400).json({
                success: false,
                message: "Only milestones in progress can be submitted"
            });
        }
        if (!isFreelancer) {
            return res.status(403).json({
                success: false,
                message: "Only the freelancer can submit a milestone"
            });
        }
    } else if (status === "approved") {
        if (currentStatus !== "submitted") {
            return res.status(400).json({
                success: false,
                message: "Only submitted milestones can be approved"
            });
        }
        if (!isClient) {
            return res.status(403).json({
                success: false,
                message: "Only the client can approve a milestone"
            });
        }
    } else {
        return res.status(400).json({
            success: false,
            message: `Invalid status transition target: ${status}`
        });
    }

    milestone.status = status;
    await milestone.save();

    await recalculateProjectProgress(project._id, req);

    const io = req.app.get("io");
    if (io) {
        io.to(`user:${project.client}`).emit("milestone_status_changed", { milestone });
        io.to(`user:${project.freelancer}`).emit("milestone_status_changed", { milestone });
    }

    res.status(200).json({
        success: true,
        message: `Milestone status updated to ${status}`,
        data: { milestone }
    });
});

module.exports = {
    createMilestone,
    getProjectMilestones,
    updateMilestone,
    deleteMilestone,
    updateMilestoneStatus
};
