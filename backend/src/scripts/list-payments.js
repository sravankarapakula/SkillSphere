const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Payment = require("../models/Payment");
const Project = require("../models/Project.models");
const Gig = require("../models/Gig.models");
const User = require("../models/user.models");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function listPayments() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        const payments = await Payment.find({})
            .populate("projectId")
            .populate("clientId")
            .populate("freelancerId");

        console.log(`Found ${payments.length} Payments.`);
        payments.forEach((p, index) => {
            console.log(`\n--- Payment #${index + 1} ---`);
            console.log(`ID: ${p._id}`);
            console.log(`Project ID: ${p.projectId?._id || p.projectId}`);
            console.log(`Client: ${p.clientId?.name} (${p.clientId?._id})`);
            console.log(`Freelancer: ${p.freelancerId?.name} (${p.freelancerId?._id})`);
            console.log(`Amount: ${p.amount}`);
            console.log(`Status: ${p.status}`);
            console.log(`OrderId: ${p.razorpayOrderId}`);
            console.log(`PaymentId: ${p.razorpayPaymentId}`);
            console.log(`PaidAt: ${p.paidAt}`);
        });

    } catch (err) {
        console.error("Error listing payments:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Database disconnected.");
    }
}

listPayments();
