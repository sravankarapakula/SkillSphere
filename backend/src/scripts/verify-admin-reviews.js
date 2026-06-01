const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Review = require("../models/Review");
const Project = require("../models/Project.models");
const User = require("../models/user.models");
const Gig = require("../models/Gig.models");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function runTest() {
    let testClient, testFreelancer, testGig, testProject, testReview;
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        // 1. Create test users, gig, project
        console.log("\n--- Creating Test Data ---");
        testClient = await User.create({
            name: "Test Client AdminReview",
            email: `client.adminreview.${Date.now()}@example.com`,
            password: "password123",
            role: "client"
        });

        testFreelancer = await User.create({
            name: "Test Freelancer AdminReview",
            email: `freelancer.adminreview.${Date.now()}@example.com`,
            password: "password123",
            role: "freelancer"
        });

        testGig = await Gig.create({
            title: "Gig for Admin Review Test",
            description: "Verification of project populating",
            client: testClient._id,
            budgetMin: 100,
            budgetMax: 500,
            experienceLevel: "entry",
            status: "open"
        });

        testProject = await Project.create({
            proposal: new mongoose.Types.ObjectId(), // mock proposal ID
            gig: testGig._id,
            client: testClient._id,
            freelancer: testFreelancer._id,
            agreedAmount: 300,
            estimatedDays: 10,
            status: "completed",
            progressPercentage: 100,
            expectedCompletionDate: new Date()
        });
        console.log(`Created Project: "${testGig.title}" (${testProject._id})`);

        // 2. Create test review on the project
        testReview = await Review.create({
            project: testProject._id,
            reviewer: testClient._id,
            reviewee: testFreelancer._id,
            reviewType: "client_to_freelancer",
            ratings: {
                communication: 5,
                qualityOfWork: 4,
                timeliness: 5,
                professionalism: 5
            },
            overallRating: 5,
            comment: "Excellent work on this project!"
        });
        console.log(`Created Review: ${testReview._id}`);

        // 3. Verify getAdminReviews populate behavior
        console.log("\n--- Verifying getAdminReviews query populates project title ---");
        const populatedReviews = await Review.find({ _id: testReview._id })
            .populate("reviewer reviewee", "name email")
            .populate({
                path: "project",
                select: "gig",
                populate: {
                    path: "gig",
                    select: "title"
                }
            })
            .lean();

        const rev1 = populatedReviews[0];
        if (rev1 && rev1.project) {
            rev1.project.title = rev1.project.gig?.title || "";
        }
        console.log(`- Review exists: ${!!rev1}`);
        console.log(`- Project is populated: ${!!rev1.project}`);
        console.log(`- Project title matches: ${rev1.project?.title === testGig.title}`);
        console.log(`- Project title value: "${rev1.project?.title || "-"}"`);

        // 4. Verify getAdminReviewDetails populate behavior
        console.log("\n--- Verifying getAdminReviewDetails query populates project status & title ---");
        const detailsReview = await Review.findById(testReview._id)
            .populate("reviewer reviewee hiddenBy", "name email")
            .populate({
                path: "project",
                select: "gig status",
                populate: {
                    path: "gig",
                    select: "title"
                }
            })
            .lean();

        if (detailsReview && detailsReview.project) {
            detailsReview.project.title = detailsReview.project.gig?.title || "";
        }

        console.log(`- Project title populated: "${detailsReview.project?.title}"`);
        console.log(`- Project status populated: "${detailsReview.project?.status}"`);
        console.log(`- Project ID populated: "${detailsReview.project?._id}"`);

        // 5. Simulate project deletion
        console.log("\n--- Deleting Project (Simulating Legacy/Deleted Project) ---");
        await Project.deleteOne({ _id: testProject._id });
        console.log("Deleted test project.");

        // 6. Verify lookup with deleted project
        const afterDeleteReviews = await Review.find({ _id: testReview._id })
            .populate("reviewer reviewee", "name email")
            .populate("project", "title")
            .lean();

        const rev2 = afterDeleteReviews[0];
        console.log(`- Review exists after project deletion: ${!!rev2}`);
        console.log(`- Project populated field value: ${rev2.project}`);
        console.log(`- Handled gracefully (evaluates to null): ${rev2.project === null}`);

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        // Cleanup remaining data
        console.log("\n--- Cleaning up Test Data ---");
        if (testReview) await Review.deleteOne({ _id: testReview._id });
        if (testProject) await Project.deleteOne({ _id: testProject._id });
        if (testGig) await Gig.deleteOne({ _id: testGig._id });
        if (testClient) await User.deleteOne({ _id: testClient._id });
        if (testFreelancer) await User.deleteOne({ _id: testFreelancer._id });
        console.log("Cleanup finished.");

        await mongoose.disconnect();
        console.log("Database disconnected.");
    }
}

runTest();
