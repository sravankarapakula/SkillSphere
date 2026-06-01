const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["client", "freelancer", "admin"],
        default: "client"
    },

    profileImage: {
        type: String,
        default: ""
    },

    // Legacy fields — kept for backward compatibility but no longer updated
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    totalRatingPoints: {
        type: Number,
        default: 0
    },

    // Freelancer reputation (from client_to_freelancer reviews)
    freelancerRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    freelancerReviewCount: {
        type: Number,
        default: 0
    },
    freelancerTotalRatingPoints: {
        type: Number,
        default: 0
    },

    // Client reputation (from freelancer_to_client reviews)
    clientRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    clientReviewCount: {
        type: Number,
        default: 0
    },
    clientTotalRatingPoints: {
        type: Number,
        default: 0
    },

    // Completed projects statistics
    freelancerCompletedProjects: {
        type: Number,
        default: 0
    },
    clientCompletedProjects: {
        type: Number,
        default: 0
    },

    isSuspended: {
        type: Boolean,
        default: false
    },

    suspensionReason: {
        type: String,
        default: null
    },

    suspendedAt: {
        type: Date,
        default: null
    },

    suspendedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model("User", userSchema);
