const Project = require("../models/Project.models");
const Milestone = require("../models/Milestone");
const asyncHandler = require("../utils/asynchandler");

// Helper to enrich a milestone object with computed lateness and overdue flags
const enrichMilestone = (m) => {
    const milestoneObj = m.toObject ? m.toObject() : m;
    const status = milestoneObj.status;
    const dueDate = milestoneObj.dueDate;
    const submittedAt = milestoneObj.submittedAt;

    const isOverdue = status === "overdue" || (dueDate && new Date() > new Date(dueDate) && !["approved", "submitted"].includes(status));
    
    // lateness calculation in ms
    let lateness = 0;
    if (submittedAt && dueDate) {
        const subDate = new Date(submittedAt);
        const due = new Date(dueDate);
        if (subDate > due) {
            lateness = subDate.getTime() - due.getTime();
        }
    }

    // timeRemaining calculation in ms
    let timeRemaining = 0;
    if (dueDate && status !== "approved" && status !== "submitted") {
        const due = new Date(dueDate);
        const now = new Date();
        timeRemaining = due.getTime() - now.getTime();
    }

    // isDueSoon: <= 24 hours remaining, and status is active (pending or in_progress)
    const isDueSoon = dueDate && timeRemaining > 0 && timeRemaining <= 24 * 60 * 60 * 1000 && ["pending", "in_progress"].includes(status);

    // isUrgent: <= 6 hours remaining, and status is active (pending or in_progress)
    const isUrgent = dueDate && timeRemaining > 0 && timeRemaining <= 6 * 60 * 60 * 1000 && ["pending", "in_progress"].includes(status);

    return {
        ...milestoneObj,
        isOverdue,
        isDueSoon,
        isUrgent,
        lateness,
        timeRemaining
    };
};

// Helper to sweep active projects' past-due milestones to overdue and notify users
const checkAndUpdateOverdueMilestones = async (projectIds, req) => {
    const ids = Array.isArray(projectIds) ? projectIds : [projectIds];
    if (ids.length === 0) return [];

    // Find all milestones that are past their due date and are pending/in_progress
    const overdueMilestones = await Milestone.find({
        project: { $in: ids },
        status: { $in: ["pending", "in_progress"] },
        dueDate: { $ne: null, $lt: new Date() }
    }).populate("project");

    if (overdueMilestones.length === 0) return [];

    const io = req.app.get("io");

    for (const milestone of overdueMilestones) {
        const prevStatus = milestone.status;
        milestone.status = "overdue";
        await milestone.save();

        if (io && prevStatus !== "overdue") {
            const project = milestone.project;
            io.to(`user:${project.client}`).emit("milestone_overdue", { milestoneId: milestone._id, projectId: project._id });
            io.to(`user:${project.freelancer}`).emit("milestone_overdue", { milestoneId: milestone._id, projectId: project._id });

            const enriched = enrichMilestone(milestone);
            io.to(`user:${project.client}`).emit("milestone_status_changed", { milestone: enriched });
            io.to(`user:${project.freelancer}`).emit("milestone_status_changed", { milestone: enriched });
        }
    }

    return overdueMilestones;
};

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

    const enriched = enrichMilestone(milestone);

    const io = req.app.get("io");
    if (io) {
        io.to(`user:${project.client}`).emit("milestone_created", { milestone: enriched });
        io.to(`user:${project.freelancer}`).emit("milestone_created", { milestone: enriched });
    }

    res.status(201).json({
        success: true,
        message: "Milestone created successfully",
        data: { milestone: enriched }
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

    // Run overdue sweep before returning milestones
    await checkAndUpdateOverdueMilestones(projectId, req);

    const milestones = await Milestone.find({ project: projectId }).sort({ order: 1, createdAt: 1 });

    const totalBudget = project.agreedAmount;
    const allocatedBudget = milestones.reduce((sum, m) => sum + m.amount, 0);
    const remainingBudget = totalBudget - allocatedBudget;

    const enrichedMilestones = milestones.map(m => enrichMilestone(m));

    res.status(200).json({
        success: true,
        data: {
            milestones: enrichedMilestones,
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

    const enriched = enrichMilestone(milestone);

    const io = req.app.get("io");
    if (io) {
        io.to(`user:${project.client}`).emit("milestone_updated", { milestone: enriched });
        io.to(`user:${project.freelancer}`).emit("milestone_updated", { milestone: enriched });
    }

    res.status(200).json({
        success: true,
        message: "Milestone updated successfully",
        data: { milestone: enriched }
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
        if (currentStatus !== "pending" && currentStatus !== "overdue") {
            return res.status(400).json({
                success: false,
                message: "Only pending or overdue milestones can start work (move to in_progress)"
            });
        }
        if (!isFreelancer) {
            return res.status(403).json({
                success: false,
                message: "Only the freelancer can start work on a milestone"
            });
        }
    } else if (status === "submitted") {
        if (currentStatus !== "in_progress" && currentStatus !== "overdue") {
            return res.status(400).json({
                success: false,
                message: "Only milestones in progress or overdue can be submitted"
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
    if (status === "submitted") {
        milestone.submittedAt = new Date();
    } else if (status === "approved") {
        milestone.approvedAt = new Date();
        milestone.isLocked = true;
    }
    await milestone.save();

    await recalculateProjectProgress(project._id, req);

    const enriched = enrichMilestone(milestone);

    const io = req.app.get("io");
    if (io) {
        io.to(`user:${project.client}`).emit("milestone_status_changed", { milestone: enriched });
        io.to(`user:${project.freelancer}`).emit("milestone_status_changed", { milestone: enriched });
    }

    res.status(200).json({
        success: true,
        message: `Milestone status updated to ${status}`,
        data: { milestone: enriched }
    });
});

module.exports = {
    createMilestone,
    getProjectMilestones,
    updateMilestone,
    deleteMilestone,
    updateMilestoneStatus,
    checkAndUpdateOverdueMilestones,
    enrichMilestone
};
