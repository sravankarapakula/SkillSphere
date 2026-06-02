const Gig = require("../models/Gig.models");
const Proposal = require("../models/Proposal.models");
const Project = require("../models/Project.models");
const Conversation = require("../models/Conversation");
const asyncHandler = require("../utils/asynchandler");

// Socket helper to emit state updates
const emitProposalUpdate = (req, proposal) => {
    const io = req.app.get("io");
    if (!io) return;

    const freelancerId = proposal.freelancer?._id || proposal.freelancer;
    const clientId = proposal.gig?.client || proposal.gig;

    if (freelancerId) {
        io.to(`user:${freelancerId}`).emit("proposal_updated", { proposal });
    }
    if (clientId) {
        io.to(`user:${clientId}`).emit("proposal_updated", { proposal });
    }
};

const createProposal = asyncHandler(async (req, res) => {
    const gig = await Gig.findById(req.body.gig);

    if (!gig || gig.status !== "open" || gig.isDisabled) {
        return res.status(404).json({
            success: false,
            message: "Open gig not found"
        });
    }

    const existingProposal = await Proposal.findOne({
        gig: gig._id,
        freelancer: req.user._id
    });

    if (existingProposal) {
        return res.status(400).json({
            success: false,
            message: "You already proposed for this gig"
        });
    }

    const proposal = await Proposal.create({
        gig: gig._id,
        freelancer: req.user._id,
        coverLetter: req.body.coverLetter,
        bidAmount: req.body.bidAmount,
        estimatedDays: req.body.estimatedDays,
        status: "submitted"
    });

    await proposal.populate([
        { path: "gig", select: "title budgetMin budgetMax status client" },
        { path: "freelancer", select: "name email profileImage" }
    ]);

    emitProposalUpdate(req, proposal);

    res.status(201).json({
        success: true,
        message: "Proposal submitted",
        data: { proposal }
    });
});

const getMyProposals = asyncHandler(async (req, res) => {
    const proposals = await Proposal.find({ freelancer: req.user._id })
        .populate("gig", "title budgetMin budgetMax status client")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: { proposals }
    });
});

const getGigProposals = asyncHandler(async (req, res) => {
    const gig = await Gig.findById(req.params.gigId);

    if (!gig) {
        return res.status(404).json({
            success: false,
            message: "Gig not found"
        });
    }

    if (gig.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Only the gig owner can view proposals"
        });
    }

    const proposals = await Proposal.find({ gig: gig._id })
        .populate("freelancer", "name email profileImage")
        .populate("gig", "title")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: { gig, proposals }
    });
});


// PATCH /proposals/:id/shortlist
const shortlistProposal = asyncHandler(async (req, res) => {
    const proposal = await Proposal.findById(req.params.id)
        .populate("gig", "client title")
        .populate("freelancer", "name email profileImage");

    if (!proposal) {
        return res.status(404).json({
            success: false,
            message: "Proposal not found"
        });
    }

    if (proposal.gig.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Only the gig owner can shortlist proposals"
        });
    }

    if (proposal.status !== "submitted") {
        return res.status(400).json({
            success: false,
            message: `Cannot shortlist proposal in status: ${proposal.status}`
        });
    }

    proposal.status = "shortlisted";
    proposal.shortlistedAt = new Date();
    await proposal.save();

    emitProposalUpdate(req, proposal);

    res.status(200).json({
        success: true,
        message: "Proposal shortlisted successfully",
        data: { proposal }
    });
});

// PATCH /proposals/:id/reject
const rejectProposal = asyncHandler(async (req, res) => {
    const proposal = await Proposal.findById(req.params.id)
        .populate("gig", "client title")
        .populate("freelancer", "name email profileImage");

    if (!proposal) {
        return res.status(404).json({
            success: false,
            message: "Proposal not found"
        });
    }

    if (proposal.gig.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Only the gig owner can reject proposals"
        });
    }

    if (["accepted", "hired", "completed", "withdrawn", "rejected"].includes(proposal.status)) {
        return res.status(400).json({
            success: false,
            message: `Cannot reject proposal in status: ${proposal.status}`
        });
    }

    proposal.status = "rejected";
    proposal.rejectedAt = new Date();
    await proposal.save();

    emitProposalUpdate(req, proposal);

    res.status(200).json({
        success: true,
        message: "Proposal rejected successfully",
        data: { proposal }
    });
});

// PATCH /proposals/:id/withdraw
const withdrawProposal = asyncHandler(async (req, res) => {
    const proposal = await Proposal.findById(req.params.id)
        .populate("gig", "client title")
        .populate("freelancer", "name email profileImage");

    if (!proposal) {
        return res.status(404).json({
            success: false,
            message: "Proposal not found"
        });
    }

    if (proposal.freelancer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Only the proposal creator can withdraw it"
        });
    }

    if (["accepted", "hired", "completed", "withdrawn"].includes(proposal.status)) {
        return res.status(400).json({
            success: false,
            message: `Cannot withdraw proposal in status: ${proposal.status}`
        });
    }

    proposal.status = "withdrawn";
    proposal.withdrawnAt = new Date();
    await proposal.save();

    emitProposalUpdate(req, proposal);

    res.status(200).json({
        success: true,
        message: "Proposal withdrawn successfully",
        data: { proposal }
    });
});

// PATCH /proposals/:id/accept
const acceptProposal = asyncHandler(async (req, res) => {
    const proposal = await Proposal.findById(req.params.id)
        .populate("gig")
        .populate("freelancer", "name email profileImage");

    if (!proposal) {
        return res.status(404).json({
            success: false,
            message: "Proposal not found"
        });
    }

    const gig = proposal.gig;

    if (gig.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Only the gig owner can accept proposals"
        });
    }

    if (gig.isDisabled) {
        return res.status(400).json({
            success: false,
            message: "Disabled gigs cannot accept proposals"
        });
    }

    if (gig.status === "closed" || gig.hiredProposal) {
        return res.status(400).json({
            success: false,
            message: "This gig has already hired another freelancer"
        });
    }

    if (["accepted", "hired", "completed"].includes(proposal.status)) {
        return res.status(400).json({
            success: false,
            message: "This proposal is already accepted/hired"
        });
    }

    // Set proposal status and times
    proposal.status = "accepted";
    proposal.acceptedAt = new Date();
    proposal.hiredAt = new Date();

    // Auto-create Project
    const expectedDays = proposal.estimatedDays || 7;
    const project = await Project.create({
        gig: gig._id,
        proposal: proposal._id,
        client: gig.client,
        freelancer: proposal.freelancer._id,
        agreedAmount: proposal.bidAmount,
        paymentAmount: proposal.bidAmount || 0,
        paymentStatus: "unpaid",
        estimatedDays: expectedDays,
        status: "active",
        progressPercentage: 0,
        expectedCompletionDate: new Date(Date.now() + expectedDays * 24 * 60 * 60 * 1000)
    });

    proposal.status = "hired";
    proposal.project = project._id;
    await proposal.save();

    // Update Gig
    gig.status = "closed";
    gig.gigStatus = "in_progress";
    gig.hiredProposal = proposal._id;
    gig.hiredFreelancer = proposal.freelancer._id;
    gig.hiredAt = new Date();
    gig.activeFreelancers = [proposal.freelancer._id];
    await gig.save();

    // Update linked conversation to transition it to a project chat
    const conversation = await Conversation.findOne({ proposalId: proposal._id });
    if (conversation) {
        conversation.projectId = project._id;
        conversation.conversationType = "project";
        await conversation.save();
    }

    // Socket instances
    const io = req.app.get("io");

    // Emit chat update to both users if conversation was updated
    if (conversation && io) {
        const chatPayload = {
            conversationId: conversation._id.toString(),
            projectId: project._id.toString(),
            conversationType: "project",
            updatedAt: conversation.updatedAt
        };
        io.to(`user:${gig.client}`).emit("chat_updated", chatPayload);
        io.to(`user:${proposal.freelancer._id}`).emit("chat_updated", chatPayload);
    }

    // Optionally reject other proposals
    const rejectOthers = req.body.rejectOthers !== false;
    if (rejectOthers) {
        const remainingProposals = await Proposal.find({
            gig: gig._id,
            _id: { $ne: proposal._id },
            status: { $in: ["submitted", "shortlisted"] }
        }).populate("freelancer", "name email");

        for (const other of remainingProposals) {
            other.status = "rejected";
            other.rejectedAt = new Date();
            await other.save();
            // Emit socket updates for rejected freelancers
            emitProposalUpdate(req, other);
        }
    }

    // Emit socket updates for accepted proposal
    emitProposalUpdate(req, proposal);

    // Emit project_created event
    if (io) {
        const projectPayload = await Project.findById(project._id)
            .populate("gig", "title")
            .populate("client", "name email profileImage")
            .populate("freelancer", "name email profileImage");

        io.to(`user:${gig.client}`).emit("project_created", { project: projectPayload });
        io.to(`user:${proposal.freelancer._id}`).emit("project_created", { project: projectPayload });
    }

    res.status(200).json({
        success: true,
        message: "Proposal accepted and project created successfully",
        data: { proposal, project }
    });
});

const updateProposalStatus = asyncHandler(async (req, res, next) => {
    const { status } = req.body;
    if (status === "accepted") {
        return acceptProposal(req, res, next);
    }
    if (status === "rejected") {
        return rejectProposal(req, res, next);
    }

    const proposal = await Proposal.findById(req.params.id)
        .populate("gig", "client title")
        .populate("freelancer", "name email profileImage");

    if (!proposal) {
        return res.status(404).json({
            success: false,
            message: "Proposal not found"
        });
    }

    if (proposal.gig.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Only the gig owner can update proposal status"
        });
    }

    proposal.status = status;
    await proposal.save();

    emitProposalUpdate(req, proposal);

    res.status(200).json({
        success: true,
        message: "Proposal status updated",
        data: { proposal }
    });
});

module.exports = {
    createProposal,
    getMyProposals,
    getGigProposals,
    updateProposalStatus,
    shortlistProposal,
    acceptProposal,
    rejectProposal,
    withdrawProposal
};
