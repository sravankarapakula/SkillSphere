const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        freelancerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        razorpayOrderId: String,
        razorpayPaymentId: String,
        paymentMethod: String,
        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending"
        },
        paidAt: Date
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Payment", paymentSchema);
