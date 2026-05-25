const mongoose = require("mongoose");

const gigSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        skillsRequired: {
            type: [String],
            default: []
        },
        budgetMin: {
            type: Number,
            required: true,
            min: 0
        },
        budgetMax: {
            type: Number,
            required: true,
            min: 0
        },
        location: {
            type: String,
            trim: true,
            default: ""
        },
        experienceLevel: {
            type: String,
            enum: ["entry", "intermediate", "expert"],
            required: true
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["open", "closed"],
            default: "open"
        },
        hiredProposal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Proposal",
            default: null
        },
        hiredFreelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        hiredAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

module.exports = mongoose.model("Gig", gigSchema);
