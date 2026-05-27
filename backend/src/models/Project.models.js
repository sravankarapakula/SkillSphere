const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        gig: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gig",
            required: true,
            unique: true
        },
        proposal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Proposal",
            required: true,
            unique: true
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        agreedAmount: {
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
            enum: ["active", "in_progress", "revision", "paused", "completed", "cancelled"],
            default: "active"
        },
        progressPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        expectedCompletionDate: {
            type: Date,
            default: null
        },
        startedAt: {
            type: Date,
            default: Date.now
        },
        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

projectSchema.index({ client: 1, status: 1 });
projectSchema.index({ freelancer: 1, status: 1 });

module.exports = mongoose.model("Project", projectSchema);
