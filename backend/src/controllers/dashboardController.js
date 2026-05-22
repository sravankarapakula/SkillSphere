const Gig = require("../models/Gig.models");
const Proposal = require("../models/Proposal.models");
const User = require("../models/user.models");
const asyncHandler = require("../utils/asynchandler");

const getClientDashboard = asyncHandler(async (req, res) => {
    const gigs = await Gig.find({ client: req.user._id }).select("_id status");
    const gigIds = gigs.map((gig) => gig._id);
    const openGigIds = gigs
        .filter((gig) => gig.status === "open")
        .map((gig) => gig._id);

    const [
        totalGigsPosted,
        openGigs,
        closedGigs,
        totalProposalsReceived,
        acceptedProposals,
        pendingProposals,
        activeProjects
    ] = await Promise.all([
        Gig.countDocuments({ client: req.user._id }),
        Gig.countDocuments({ client: req.user._id, status: "open" }),
        Gig.countDocuments({ client: req.user._id, status: "closed" }),
        Proposal.countDocuments({ gig: { $in: gigIds } }),
        Proposal.countDocuments({ gig: { $in: gigIds }, status: "accepted" }),
        Proposal.countDocuments({ gig: { $in: gigIds }, status: "pending" }),
        Proposal.countDocuments({ gig: { $in: openGigIds }, status: "accepted" })
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
            activeProjects
        }
    });
});

const getFreelancerDashboard = asyncHandler(async (req, res) => {
    const acceptedProposalsForGigs = await Proposal.find({
        freelancer: req.user._id,
        status: "accepted"
    }).select("gig");
    const acceptedGigIds = acceptedProposalsForGigs.map((proposal) => proposal.gig);

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
        Gig.countDocuments({ _id: { $in: acceptedGigIds }, status: "open" }),
        Gig.countDocuments({ _id: { $in: acceptedGigIds }, status: "closed" })
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
        openProjects
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "freelancer" }),
        User.countDocuments({ role: "client" }),
        Gig.countDocuments(),
        Proposal.countDocuments(),
        Gig.countDocuments({ status: "open" })
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            totalFreelancers,
            totalClients,
            totalGigs,
            totalProposals,
            openProjects
        }
    });
});

module.exports = {
    getClientDashboard,
    getFreelancerDashboard,
    getAdminDashboard
};
