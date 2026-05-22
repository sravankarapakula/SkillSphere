const Gig = require("../models/Gig.models");
const Proposal = require("../models/Proposal.models");
const asyncHandler = require("../utils/asynchandler");

const createProposal = asyncHandler(async (req, res) => {
    console.log("BODY:", req.body);

    console.log("USER:", req.user);
    const gig = await Gig.findById(req.body.gig);

    if (!gig || gig.status !== "open") {
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
        estimatedDays: req.body.estimatedDays
    });

    await proposal.populate([
        { path: "gig", select: "title budgetMin budgetMax status" },
        { path: "freelancer", select: "name email" }
    ]);

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
        .populate("freelancer", "name email")
        .populate("gig", "title")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: { gig, proposals }
    });
});

const updateProposalStatus = asyncHandler(async (req, res) => {
    const proposal = await Proposal.findById(req.params.id).populate("gig", "client title");

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

    proposal.status = req.body.status;
    await proposal.save();
    await proposal.populate("freelancer", "name email");

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
    updateProposalStatus
};
