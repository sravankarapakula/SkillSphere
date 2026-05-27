const Gig = require("../models/Gig.models");
const Proposal = require("../models/Proposal.models");
const Project = require("../models/Project.models");
const User = require("../models/user.models");
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
        completedProjects
    ] = await Promise.all([
        Gig.countDocuments({ client: req.user._id }),
        Gig.countDocuments({ client: req.user._id, status: "open" }),
        Gig.countDocuments({ client: req.user._id, status: "closed" }),
        Proposal.countDocuments({ gig: { $in: gigIds } }),
        Proposal.countDocuments({ gig: { $in: gigIds }, status: "accepted" }),
        Proposal.countDocuments({ gig: { $in: gigIds }, status: "pending" }),
        Project.countDocuments({ client: req.user._id, status: { $in: ["active", "in_progress", "revision"] } }),
        Project.countDocuments({ client: req.user._id, status: "completed" })
    ]);

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
            completedProjects
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
        completedProjects
    ] = await Promise.all([
        Proposal.countDocuments({ freelancer: req.user._id }),
        Proposal.countDocuments({ freelancer: req.user._id, status: "accepted" }),
        Proposal.countDocuments({ freelancer: req.user._id, status: "rejected" }),
        Proposal.countDocuments({ freelancer: req.user._id, status: "pending" }),
        Project.countDocuments({ freelancer: req.user._id, status: { $in: ["active", "in_progress", "revision"] } }),
        Project.countDocuments({ freelancer: req.user._id, status: "completed" })
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalProposalsSent,
            acceptedProposals,
            rejectedProposals,
            pendingProposals,
            activeProjects,
            completedProjects,
            gigsApplied: totalProposalsSent
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
        activeProjects
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "freelancer" }),
        User.countDocuments({ role: "client" }),
        Gig.countDocuments(),
        Proposal.countDocuments(),
        Gig.countDocuments({ status: "open" }),
        Project.countDocuments({ status: { $in: ["active", "in_progress"] } })
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            totalFreelancers,
            totalClients,
            totalGigs,
            totalProposals,
            openProjects,
            activeProjects
        }
    });
});

module.exports = {
    getClientDashboard,
    getFreelancerDashboard,
    getAdminDashboard
};
