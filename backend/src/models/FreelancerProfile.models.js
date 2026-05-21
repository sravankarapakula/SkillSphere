const mongoose = require("mongoose");

const portfolioItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String
    },
    projectUrl: {
        type: String,
        trim: true
    }
});

const experienceSchema = new mongoose.Schema({
    company: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    description: {
        type: String,
        trim: true
    }
});

const freelancerProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        title: {
            type: String,
            trim: true,
            default: ""
        },

        bio: {
            type: String,
            trim: true,
            default: ""
        },

        skills: {
            type: [String],
            default: []
        },

        hourlyRate: {
            type: Number,
            default: 0,
            min: 0
        },

        availability: {
            type: String,
            enum: ["available", "busy", "unavailable"],
            default: "available"
        },

        profileImage: {
            type: String,
            default: ""
        },

        resume: {
            type: String,
            default: ""
        },

        portfolio: {
            type: [portfolioItemSchema],
            default: []
        },

        experience: {
            type: [experienceSchema],
            default: []
        },

        location: {
            type: String,
            trim: true,
            default: ""
        },

        completionScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    {
        timestamps: true
    }
);

// Instance method to calculate profile completion
freelancerProfileSchema.methods.calculateCompletion = function () {
    let score = 0;
    const fields = [
        { check: this.title, weight: 15 },
        { check: this.bio, weight: 15 },
        { check: this.skills.length > 0, weight: 15 },
        { check: this.hourlyRate > 0, weight: 10 },
        { check: this.profileImage, weight: 15 },
        { check: this.resume, weight: 10 },
        { check: this.portfolio.length > 0, weight: 10 },
        { check: this.experience.length > 0, weight: 5 },
        { check: this.location, weight: 5 }
    ];

    fields.forEach((field) => {
        if (field.check) score += field.weight;
    });

    this.completionScore = score;
    return score;
};

module.exports = mongoose.model("FreelancerProfile", freelancerProfileSchema);
