const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3
        },
        description: {
            type: String,
            default: "",
            trim: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        dueDate: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ["pending", "in_progress", "submitted", "approved", "rejected", "overdue"],
            default: "pending"
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium"
        },
        submittedAt: {
            type: Date,
            default: null
        },
        approvedAt: {
            type: Date,
            default: null
        },
        isLocked: {
            type: Boolean,
            default: false
        },
        order: {
            type: Number,
            default: 0
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

milestoneSchema.index({ project: 1, order: 1 });

module.exports = mongoose.model("Milestone", milestoneSchema);
