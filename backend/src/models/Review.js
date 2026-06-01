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
        reviewType: {
            type: String,
            enum: ["client_to_freelancer", "freelancer_to_client"],
            required: true
        },
        ratings: {
            type: {
                communication: { type: Number, min: 1, max: 5 },
                professionalism: { type: Number, min: 1, max: 5 },
                qualityOfWork: { type: Number, min: 1, max: 5 },
                timeliness: { type: Number, min: 1, max: 5 },
                requirementClarity: { type: Number, min: 1, max: 5 },
                responsiveness: { type: Number, min: 1, max: 5 }
            },
            required: true,
            validate: {
                validator: function (val) {
                    if (this.reviewType === "client_to_freelancer") {
                        return (
                            val.communication != null &&
                            val.professionalism != null &&
                            val.qualityOfWork != null &&
                            val.timeliness != null &&
                            (val.requirementClarity === undefined || val.requirementClarity === null) &&
                            (val.responsiveness === undefined || val.responsiveness === null)
                        );
                    } else if (this.reviewType === "freelancer_to_client") {
                        return (
                            val.communication != null &&
                            val.professionalism != null &&
                            val.requirementClarity != null &&
                            val.responsiveness != null &&
                            (val.qualityOfWork === undefined || val.qualityOfWork === null) &&
                            (val.timeliness === undefined || val.timeliness === null)
                        );
                    }
                    return false;
                },
                message: "Ratings categories must match the reviewer's role exactly."
            }
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
        },
        isHidden: {
            type: Boolean,
            default: false
        },
        hiddenAt: {
            type: Date,
            default: null
        },
        hiddenBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Enforce: one review per reviewer per project
reviewSchema.index({ project: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, createdAt: -1 });
reviewSchema.index({ reviewType: 1, reviewee: 1 });

module.exports = mongoose.model("Review", reviewSchema);
