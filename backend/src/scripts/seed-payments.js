const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Payment = require("../models/Payment");
const Project = require("../models/Project.models");
const User = require("../models/user.models");
const Gig = require("../models/Gig.models");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const demoTransactions = [
  {
    projectId: "6a1d9fc896de6d5e215e07d4",
    clientId: "6a1d9fc896de6d5e215e07d0",
    freelancerId: "6a1d9fc896de6d5e215e07d1",
    amount: 5000,
    status: "completed",
    razorpayOrderId: "order_demo_001",
    razorpayPaymentId: "pay_demo_001",
    paidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
  },
  {
    projectId: "6a1d9fe3cdc20ee77a01abd1",
    clientId: "6a1d9fe3cdc20ee77a01abcb",
    freelancerId: "6a1d9fe3cdc20ee77a01abcc",
    amount: 3500,
    status: "completed",
    razorpayOrderId: "order_demo_002",
    razorpayPaymentId: "pay_demo_002",
    paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    projectId: "6a1d9fe3cdc20ee77a01abd2",
    clientId: "6a1d9fe3cdc20ee77a01abcb",
    freelancerId: "6a1d9fe3cdc20ee77a01abcc",
    amount: 7000,
    status: "completed",
    razorpayOrderId: "order_demo_003",
    razorpayPaymentId: "pay_demo_003",
    paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    projectId: "6a1daa8e33c6331429ca2433",
    clientId: "6a0c6bd6c7e96b6f324a1121",
    freelancerId: "6a0c6facc7e96b6f324a1124",
    amount: 4500,
    status: "completed",
    razorpayOrderId: "order_demo_004",
    razorpayPaymentId: "pay_demo_004",
    paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    projectId: "6a1db0b426b970d12719e158",
    clientId: "6a0c6bd6c7e96b6f324a1121",
    freelancerId: "6a0c6facc7e96b6f324a1124",
    amount: 6000,
    status: "completed",
    razorpayOrderId: "order_demo_005",
    razorpayPaymentId: "pay_demo_005",
    paidAt: new Date() // Today
  }
];

async function seed() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        // Clear existing payments
        await Payment.deleteMany({});
        console.log("Cleared existing payments.");

        // Reset all projects to unpaid first
        await Project.updateMany({}, {
            paymentStatus: "unpaid",
            paymentDate: null,
            paymentAmount: 0
        });
        console.log("Reset all projects to unpaid.");

        // Insert payments and update projects
        for (const tx of demoTransactions) {
            const pId = mongoose.Types.ObjectId.createFromHexString(tx.projectId);
            const cId = mongoose.Types.ObjectId.createFromHexString(tx.clientId);
            const fId = mongoose.Types.ObjectId.createFromHexString(tx.freelancerId);

            // 1. Create payment record with proper ObjectIds
            const payment = await Payment.create({
                projectId: pId,
                clientId: cId,
                freelancerId: fId,
                amount: tx.amount,
                status: tx.status,
                razorpayOrderId: tx.razorpayOrderId,
                razorpayPaymentId: tx.razorpayPaymentId,
                paymentMethod: "Razorpay Checkout",
                paidAt: tx.paidAt
            });

            // 2. Update Project to paid
            await Project.findByIdAndUpdate(pId, {
                paymentStatus: "paid",
                paymentAmount: tx.amount,
                paymentDate: tx.paidAt
            });

            console.log(`Seeded payment ${payment.razorpayPaymentId} for Project ${tx.projectId} (amount: ₹${tx.amount})`);
        }

        console.log("\nSeeding finished successfully!");

    } catch (error) {
        console.error("Seeding failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Database disconnected.");
    }
}

seed();
