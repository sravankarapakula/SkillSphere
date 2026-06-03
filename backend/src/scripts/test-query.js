const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load all models in the same order as the express server
const User = require("../models/user.models");
const Gig = require("../models/Gig.models");
const Proposal = require("../models/Proposal.models");
const Project = require("../models/Project.models");
const Payment = require("../models/Payment");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function runTest() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        // Query payments for test1 (client ID: 6a0c6bd6c7e96b6f324a1121)
        const clientId = "6a0c6bd6c7e96b6f324a1121";
        const payments = await Payment.find({ clientId })
            .populate({
                path: "projectId",
                select: "gig",
                populate: {
                    path: "gig",
                    select: "title"
                }
            })
            .populate("clientId", "name email profileImage")
            .populate("freelancerId", "name email profileImage")
            .sort({ createdAt: -1 });

        console.log("Query succeeded! Found payments:", payments.length);
        console.log(JSON.stringify(payments, null, 2));

    } catch (err) {
        console.error("Query failed with error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
