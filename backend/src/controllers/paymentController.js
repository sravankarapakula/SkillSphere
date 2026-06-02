const Payment = require("../models/Payment");
const Project = require("../models/Project.models");
const asyncHandler = require("../utils/asynchandler");
const { createRazorpayOrder, verifyPaymentSignature } = require("../services/paymentService");

// POST /api/payments/create-order
const createOrder = asyncHandler(async (req, res) => {
    const { projectId } = req.body;

    if (!projectId) {
        return res.status(400).json({
            success: false,
            message: "Project ID is required"
        });
    }

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found"
        });
    }

    // Authorization: Must be the Client of the project
    if (project.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Access denied: You are not the client for this project"
        });
    }

    // Verify payment status is unpaid
    if (project.paymentStatus === "paid") {
        return res.status(400).json({
            success: false,
            message: "Project has already been paid"
        });
    }

    const amount = project.paymentAmount || project.agreedAmount || 0;
    if (amount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid project amount"
        });
    }

    try {
        const order = await createRazorpayOrder(project._id, amount);
        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: order.amount, // in paise
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error("Razorpay Order Creation Error:", error);
        res.status(500).json({
            success: false,
            message: "Could not create payment order"
        });
    }
});

// POST /api/payments/verify
const verifyPayment = asyncHandler(async (req, res) => {
    const { projectId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!projectId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
            success: false,
            message: "Missing required payment verification details"
        });
    }

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found"
        });
    }

    // Authorization: Must be the Client of the project
    if (project.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Access denied: You are not the client for this project"
        });
    }

    // Check signature validity
    const isSignatureValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isSignatureValid) {
        return res.status(400).json({
            success: false,
            message: "Payment signature verification failed"
        });
    }

    // Prevent duplicate payment creation
    const existingPayment = await Payment.findOne({
        projectId: project._id,
        status: "completed"
    });

    if (existingPayment) {
        return res.status(400).json({
            success: false,
            message: "Payment has already been recorded for this project"
        });
    }

    // Create payment record
    const payment = await Payment.create({
        projectId: project._id,
        clientId: project.client,
        freelancerId: project.freelancer,
        amount: project.paymentAmount || project.agreedAmount || 0,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paymentMethod: "Razorpay Checkout",
        status: "completed",
        paidAt: new Date()
    });

    // Update project state
    project.paymentStatus = "paid";
    project.paymentDate = payment.paidAt;
    await project.save();

    // Populate updated project payload for socket
    const populatedProject = await Project.findById(project._id)
        .populate("gig")
        .populate("client", "name email profileImage")
        .populate("freelancer", "name email profileImage");

    // Emit Socket events
    const io = req.app.get("io");
    if (io) {
        io.to(`user:${project.client}`).emit("payment_success", { project: populatedProject, payment });
        io.to(`user:${project.freelancer}`).emit("payment_success", { project: populatedProject, payment });
        io.to(`user:${project.client}`).emit("project_updated", { project: populatedProject });
        io.to(`user:${project.freelancer}`).emit("project_updated", { project: populatedProject });
        io.emit("payment_updated", { project: populatedProject, payment });
    }

    res.status(200).json({
        success: true,
        message: "Payment verified and recorded successfully",
        data: { payment, project: populatedProject }
    });
});

// GET /api/payments/my
const getMyPayments = asyncHandler(async (req, res) => {
    const role = req.user.role;
    let query = {};

    if (role === "client") {
        query.clientId = req.user._id;
    } else if (role === "freelancer") {
        query.freelancerId = req.user._id;
    } else if (role === "admin") {
        // Admin sees all
        query = {};
    } else {
        return res.status(403).json({
            success: false,
            message: "Unauthorized role"
        });
    }

    const payments = await Payment.find(query)
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

    res.status(200).json({
        success: true,
        data: { payments }
    });
});

// GET /api/payments/project/:projectId
const getProjectPayment = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found"
        });
    }

    const userIdStr = req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isClient = project.client.toString() === userIdStr;
    const isFreelancer = project.freelancer.toString() === userIdStr;

    // Authorization check
    if (!isAdmin && !isClient && !isFreelancer) {
        return res.status(403).json({
            success: false,
            message: "Access denied: You are not authorized to view payments for this project"
        });
    }

    const payment = await Payment.findOne({ projectId: project._id, status: "completed" })
        .populate("clientId", "name email")
        .populate("freelancerId", "name email");

    res.status(200).json({
        success: true,
        data: { payment }
    });
});

module.exports = {
    createOrder,
    verifyPayment,
    getMyPayments,
    getProjectPayment
};
