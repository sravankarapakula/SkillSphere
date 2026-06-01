const Review = require("../models/Review");
const Project = require("../models/Project.models");
const User = require("../models/user.models");

const migrateExistingReviews = async () => {
    try {
        // Drop legacy indexes if they exist
        const indexes = await Review.collection.listIndexes().toArray();
        console.log("Current indexes on reviews collection:", indexes.map(i => i.name));

        const legacyIndexNames = [
            "reviewerId_1_gigId_1",
            "reviewerId_1_revieweeId_1",
            "reviewer_1_reviewee_1",
            "reviewerId_1_revieweeId_1_unique",
            "reviewer_1_reviewee_1_project_1"
        ];

        for (const index of indexes) {
            if (
                legacyIndexNames.includes(index.name) ||
                index.name.includes("reviewerId") ||
                index.name.includes("revieweeId") ||
                index.name.includes("reviewee_1_reviewer_1")
            ) {
                console.log(`Dropping legacy index: ${index.name}`);
                try {
                    await Review.collection.dropIndex(index.name);
                } catch (idxErr) {
                    console.warn(`Could not drop index ${index.name}:`, idxErr.message);
                }
            }
        }

        // Re-sync Mongoose indexes
        await Review.syncIndexes();
        console.log("Mongoose indexes synced successfully.");

        const unmigratedReviews = await Review.find({ reviewType: { $exists: false } });
        if (unmigratedReviews.length === 0) {
            console.log("No unmigrated reviews found.");
            return;
        }

        console.log(`Found ${unmigratedReviews.length} unmigrated reviews. Starting migration...`);

        for (const review of unmigratedReviews) {
            // 1. Try to find the associated project to determine roles
            const project = await Project.findById(review.project);
            if (project) {
                if (project.client.toString() === review.reviewer.toString()) {
                    review.reviewType = "client_to_freelancer";
                } else if (project.freelancer.toString() === review.reviewer.toString()) {
                    review.reviewType = "freelancer_to_client";
                }
            }

            // 2. Fallback: check reviewer user role
            if (!review.reviewType) {
                const reviewer = await User.findById(review.reviewer);
                if (reviewer) {
                    if (reviewer.role === "client") {
                        review.reviewType = "client_to_freelancer";
                    } else if (reviewer.role === "freelancer") {
                        review.reviewType = "freelancer_to_client";
                    }
                }
            }

            // 3. Last fallback: default to client_to_freelancer
            if (!review.reviewType) {
                review.reviewType = "client_to_freelancer";
            }

            // 4. Migrate old category ratings structure
            if (review.ratings) {
                if (review.reviewType === "client_to_freelancer") {
                    const rawRatings = review.toObject().ratings || {};
                    if (rawRatings.quality !== undefined && rawRatings.qualityOfWork === undefined) {
                        review.ratings.qualityOfWork = rawRatings.quality;
                    }
                }
            }

            await review.save();
        }

        console.log("Reviews migration completed successfully!");
    } catch (err) {
        console.error("Error during reviews migration:", err);
    }
};

module.exports = migrateExistingReviews;
