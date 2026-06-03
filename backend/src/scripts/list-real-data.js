const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Project = require("../models/Project.models");
const Gig = require("../models/Gig.models");
const User = require("../models/user.models");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function listData() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        // Find users
        const users = await User.find({}).select("_id name email role");
        console.log(`\n--- Found ${users.length} Users ---`);
        users.forEach(u => {
            console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
        });

        // Find projects
        const projects = await Project.find({})
            .populate("client", "name")
            .populate("freelancer", "name")
            .populate("gig", "title");
        console.log(`\n--- Found ${projects.length} Projects ---`);
        projects.forEach(p => {
            console.log(`- ID: ${p._id}, Gig: ${p.gig?.title || "N/A"}, Client: ${p.client?.name} (${p.client?._id}), Freelancer: ${p.freelancer?.name} (${p.freelancer?._id}), AgreedAmount: ${p.agreedAmount}, paymentAmount: ${p.paymentAmount}, paymentStatus: ${p.paymentStatus}`);
        });

    } catch (error) {
        console.error("Failed to query data:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Database disconnected.");
    }
}

listData();
