const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        reviewee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        ratings: {
            communication: { type: Number, required: true, min: 1, max: 5 },
            quality: { type: Number, required: true, min: 1, max: 5 },
            timeliness: { type: Number, required: true, min: 1, max: 5 },
            professionalism: { type: Number, required: true, min: 1, max: 5 }
        },
        overallRating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            maxlength: 1000,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// Enforce: one review per reviewer per project
reviewSchema.index({ project: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
