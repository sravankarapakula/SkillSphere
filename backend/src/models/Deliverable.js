const mongoose = require("mongoose");

const deliverableFileSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            default: null
        },
        fileName: {
            type: String,
            required: true
        },
        fileType: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            default: 0
        },
        resourceType: {
            type: String,
            enum: ["image", "raw", "video", "auto"],
            default: "raw"
        }
    },
    { _id: true }
);

const deliverableSchema = new mongoose.Schema(
    {
        milestone: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Milestone",
            required: true
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        files: {
            type: [deliverableFileSchema],
            validate: {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: "At least one file is required"
            }
        },
        notes: {
            type: String,
            default: "",
            trim: true,
            maxlength: 5000
        },
        version: {
            type: Number,
            default: 1,
            min: 1
        },
        status: {
            type: String,
            enum: ["submitted", "approved", "rejected"],
            default: "submitted"
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        reviewedAt: {
            type: Date,
            default: null
        },
        reviewFeedback: {
            type: String,
            default: "",
            trim: true,
            maxlength: 5000
        }
    },
    {
        timestamps: true
    }
);

// Compound index for fast lookups: all deliverables for a milestone, ordered by version
deliverableSchema.index({ milestone: 1, version: -1 });

// Index for project-level queries
deliverableSchema.index({ project: 1, createdAt: -1 });

// Index for user submissions
deliverableSchema.index({ submittedBy: 1, createdAt: -1 });

module.exports = mongoose.model("Deliverable", deliverableSchema);
