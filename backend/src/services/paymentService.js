const crypto = require("crypto");
const razorpay = require("../config/razorpay");

/**
 * Creates a Razorpay Order
 * @param {string} projectId
 * @param {number} amount In INR
 * @returns {Promise<object>} Razorpay Order
 */
const createRazorpayOrder = async (projectId, amount) => {
    // Razorpay amount is in paise (1 INR = 100 paise)
    const options = {
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: String(projectId)
    };
    return await razorpay.orders.create(options);
};

/**
 * Verifies Razorpay Payment Signature
 * @param {string} orderId
 * @param {string} paymentId
 * @param {string} signature
 * @returns {boolean} Is signature valid
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
    const text = orderId + "|" + paymentId;
    const generated_signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest("hex");
    return generated_signature === signature;
};

module.exports = {
    createRazorpayOrder,
    verifyPaymentSignature
};
