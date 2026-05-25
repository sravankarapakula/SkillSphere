const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
    {
        gig: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gig",
            required: true
        },
        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        coverLetter: {
            type: String,
            required: true,
            trim: true
        },
        bidAmount: {
            type: Number,
            required: true,
            min: 0
        },
        estimatedDays: {
            type: Number,
            required: true,
            min: 1
        },
        status: {
            type: String,
            enum: ["submitted", "shortlisted", "accepted", "rejected", "withdrawn", "hired", "completed"],
            default: "submitted"
        },
        shortlistedAt: {
            type: Date,
            default: null
        },
        acceptedAt: {
            type: Date,
            default: null
        },
        rejectedAt: {
            type: Date,
            default: null
        },
        withdrawnAt: {
            type: Date,
            default: null
        },
        hiredAt: {
            type: Date,
            default: null
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

proposalSchema.index({ gig: 1, freelancer: 1 }, { unique: true });

module.exports = mongoose.model("Proposal", proposalSchema);
