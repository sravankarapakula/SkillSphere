const Gig = require("../models/Gig.models");
const Proposal = require("../models/Proposal.models");
const Project = require("../models/Project.models");
const Review = require("../models/Review");
const User = require("../models/user.models");
const Payment = require("../models/Payment");
const Milestone = require("../models/Milestone");
const { checkAndUpdateOverdueMilestones, enrichMilestone } = require("./milestoneController");
const asyncHandler = require("../utils/asynchandler");

const getClientDashboard = asyncHandler(async (req, res) => {
    const gigs = await Gig.find({ client: req.user._id }).select("_id status");
    const gigIds = gigs.map((gig) => gig._id);

    const [
        totalGigsPosted,
        openGigs,
        closedGigs,
        totalProposalsReceived,
        acceptedProposals,
        pendingProposals,
        activeProjects,
        completedProjects,
        paymentsResult
    ] = await Promise.all([
        Gig.countDocuments({ client: req.user._id }),
        Gig.countDocuments({ client: req.user._id, status: "open" }),
        Gig.countDocuments({ client: req.user._id, status: "closed" }),
        Proposal.countDocuments({ gig: { $in: gigIds } }),
        Proposal.countDocuments({ gig: { $in: gigIds }, status: "accepted" }),
        Proposal.countDocuments({ gig: { $in: gigIds }, status: "pending" }),
        Project.countDocuments({ client: req.user._id, status: { $in: ["active", "in_progress", "revision"] } }),
        Project.countDocuments({ client: req.user._id, status: "completed" }),
        Payment.aggregate([
            { $match: { clientId: req.user._id, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ])
    ]);
    const totalPaymentsMade = paymentsResult[0]?.total || 0;

    // Fetch active projects to run overdue sweep
    const activeProjectsList = await Project.find({
        client: req.user._id,
        status: { $in: ["active", "in_progress", "revision"] }
    }).select("_id");
    const activeProjectIds = activeProjectsList.map(p => p._id);

    // Run sweep
    if (activeProjectIds.length > 0) {
        await checkAndUpdateOverdueMilestones(activeProjectIds, req);
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
        milestonesDueToday,
        overdueMilestones,
        pendingApprovals,
        projectsWithOverdue
    ] = await Promise.all([
        Milestone.countDocuments({
            project: { $in: activeProjectIds },
            status: { $in: ["pending", "in_progress", "overdue"] },
            dueDate: { $gte: startOfToday, $lte: endOfToday }
        }),
        Milestone.countDocuments({
            project: { $in: activeProjectIds },
            status: "overdue"
        }),
        Milestone.countDocuments({
            project: { $in: activeProjectIds },
            status: "submitted"
        }),
        Milestone.distinct("project", {
            project: { $in: activeProjectIds },
            status: "overdue"
        })
    ]);

    const atRiskProjects = projectsWithOverdue.length;

    // Compile needsAttention items (up to 10)
    const needsAttentionMilestones = await Milestone.find({
        project: { $in: activeProjectIds },
        $or: [
            { status: "submitted" },
            { status: "overdue" },
            { 
                status: { $in: ["pending", "in_progress"] },
                dueDate: { $gte: startOfToday, $lte: endOfToday }
            }
        ]
    }).populate("project", "title");

    const getPriority = (m) => {
        if (m.status === "submitted") return 1;
        if (m.status === "overdue") return 2;
        if (m.dueDate && new Date(m.dueDate) >= startOfToday && new Date(m.dueDate) <= endOfToday) return 3;
        return 4;
    };

    needsAttentionMilestones.sort((a, b) => {
        const pA = getPriority(a);
        const pB = getPriority(b);
        if (pA !== pB) return pA - pB;
        if (pA === 1) {
            return new Date(b.submittedAt || b.updatedAt) - new Date(a.submittedAt || a.updatedAt);
        }
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    const needsAttention = needsAttentionMilestones.slice(0, 10).map(m => {
        const enriched = enrichMilestone(m);
        return {
            milestoneId: m._id,
            projectId: m.project._id,
            projectTitle: m.project.title,
            milestoneTitle: m.title,
            status: m.status,
            dueDate: m.dueDate,
            submittedAt: m.submittedAt,
            timeRemaining: enriched.timeRemaining,
            lateness: enriched.lateness,
            isOverdue: enriched.isOverdue,
            isUrgent: enriched.isUrgent,
            isDueSoon: enriched.isDueSoon
        };
    });

    // Review stats
    const completedProjectsForReview = await Project.find({
        client: req.user._id,
        status: "completed"
    }).select("_id");
    const completedProjectIds = completedProjectsForReview.map(p => p._id);
    const reviewedProjectIds = await Review.find({
        reviewer: req.user._id,
        project: { $in: completedProjectIds }
    }).distinct("project");
    const pendingReviews = completedProjectIds.length - reviewedProjectIds.length;

    res.status(200).json({
        success: true,
        data: {
            totalGigsPosted,
            openGigs,
            closedGigs,
            totalProposalsReceived,
            acceptedProposals,
            pendingProposals,
            activeProjects,
            completedProjects,
            milestonesDueToday,
            overdueMilestones,
            pendingApprovals,
            atRiskProjects,
            needsAttention,
            averageRating: req.user.clientRating || 0,
            totalReviews: req.user.clientReviewCount || 0,
            pendingReviews,
            totalPaymentsMade
        }
    });
});

const getFreelancerDashboard = asyncHandler(async (req, res) => {
    const [
        totalProposalsSent,
        acceptedProposals,
        rejectedProposals,
        pendingProposals,
        activeProjects,
        completedProjects,
        earningsResult
    ] = await Promise.all([
        Proposal.countDocuments({ freelancer: req.user._id }),
        Proposal.countDocuments({ freelancer: req.user._id, status: "accepted" }),
        Proposal.countDocuments({ freelancer: req.user._id, status: "rejected" }),
        Proposal.countDocuments({ freelancer: req.user._id, status: "pending" }),
        Project.countDocuments({ freelancer: req.user._id, status: { $in: ["active", "in_progress", "revision"] } }),
        Project.countDocuments({ freelancer: req.user._id, status: "completed" }),
        Payment.aggregate([
            { $match: { freelancerId: req.user._id, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ])
    ]);
    const totalEarnings = earningsResult[0]?.total || 0;

    // Fetch active projects to run overdue sweep
    const activeProjectsList = await Project.find({
        freelancer: req.user._id,
        status: { $in: ["active", "in_progress", "revision"] }
    }).select("_id");
    const activeProjectIds = activeProjectsList.map(p => p._id);

    // Run sweep
    if (activeProjectIds.length > 0) {
        await checkAndUpdateOverdueMilestones(activeProjectIds, req);
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [
        upcomingDeadlines,
        overdueTasks,
        awaitingApproval
    ] = await Promise.all([
        Milestone.countDocuments({
            project: { $in: activeProjectIds },
            status: { $in: ["pending", "in_progress", "overdue"] },
            dueDate: { $gte: startOfToday, $lte: sevenDaysFromNow }
        }),
        Milestone.countDocuments({
            project: { $in: activeProjectIds },
            status: "overdue"
        }),
        Milestone.countDocuments({
            project: { $in: activeProjectIds },
            status: "submitted"
        })
    ]);

    // Review stats
    const completedProjectsForReview = await Project.find({
        freelancer: req.user._id,
        status: "completed"
    }).select("_id");
    const completedProjectIds = completedProjectsForReview.map(p => p._id);
    const reviewedProjectIds = await Review.find({
        reviewer: req.user._id,
        project: { $in: completedProjectIds }
    }).distinct("project");
    const pendingReviews = completedProjectIds.length - reviewedProjectIds.length;

    res.status(200).json({
        success: true,
        data: {
            totalProposalsSent,
            acceptedProposals,
            rejectedProposals,
            pendingProposals,
            activeProjects,
            completedProjects,
            gigsApplied: totalProposalsSent,
            upcomingDeadlines,
            tasksThisWeek: upcomingDeadlines,
            overdueTasks,
            awaitingApproval,
            averageRating: req.user.freelancerRating || 0,
            totalReviews: req.user.freelancerReviewCount || 0,
            pendingReviews,
            totalEarnings
        }
    });
});

const getAdminDashboard = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        totalFreelancers,
        totalClients,
        totalGigs,
        totalProposals,
        openProjects,
        activeProjects,
        totalTransactions,
        successfulPayments,
        failedPayments,
        revenueResult
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "freelancer" }),
        User.countDocuments({ role: "client" }),
        Gig.countDocuments(),
        Proposal.countDocuments(),
        Gig.countDocuments({ status: "open" }),
        Project.countDocuments({ status: { $in: ["active", "in_progress"] } }),
        Payment.countDocuments(),
        Payment.countDocuments({ status: "completed" }),
        Payment.countDocuments({ status: "failed" }),
        Payment.aggregate([
            { $match: { status: "completed" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ])
    ]);
    const revenue = revenueResult[0]?.total || 0;

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            totalFreelancers,
            totalClients,
            totalGigs,
            totalProposals,
            openProjects,
            activeProjects,
            totalTransactions,
            successfulPayments,
            failedPayments,
            revenue
        }
    });
});

module.exports = {
    getClientDashboard,
    getFreelancerDashboard,
    getAdminDashboard
};
