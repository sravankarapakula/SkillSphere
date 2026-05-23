const express = require("express");
const { body, param, query } = require("express-validator");
const protect = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
    createConversation,
    getConversations,
    getMessages,
    sendMessage,
    markAsRead
} = require("../controllers/messageController");

const router = express.Router();

// ─── Rate limiter for message sending ──────────────────────────────
const messageLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30;       // max 30 messages per minute

const messageRateLimit = (req, res, next) => {
    const userId = req.user._id.toString();
    const now = Date.now();
    const userEntry = messageLimits.get(userId);

    if (!userEntry || now - userEntry.windowStart > RATE_LIMIT_WINDOW) {
        messageLimits.set(userId, { windowStart: now, count: 1 });
        return next();
    }

    if (userEntry.count >= RATE_LIMIT_MAX) {
        return res.status(429).json({
            success: false,
            message: "Too many messages. Please wait a moment."
        });
    }

    userEntry.count++;
    return next();
};

// Cleanup stale rate limit entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [userId, entry] of messageLimits) {
        if (now - entry.windowStart > RATE_LIMIT_WINDOW * 2) {
            messageLimits.delete(userId);
        }
    }
}, 300000);

// ─── Conversation routes ───────────────────────────────────────────

router.post(
    "/conversations/create",
    protect,
    [
        body("proposalId")
            .isMongoId()
            .withMessage("Valid proposal ID is required")
    ],
    validateRequest,
    createConversation
);

router.get(
    "/conversations",
    protect,
    getConversations
);

// ─── Message routes ────────────────────────────────────────────────

router.get(
    "/messages/:conversationId",
    protect,
    [
        param("conversationId")
            .isMongoId()
            .withMessage("Valid conversation ID is required")
    ],
    validateRequest,
    getMessages
);

router.post(
    "/messages/send",
    protect,
    messageRateLimit,
    [
        body("conversationId")
            .isMongoId()
            .withMessage("Valid conversation ID is required"),
        body("text")
            .trim()
            .notEmpty()
            .withMessage("Message text is required")
            .isLength({ max: 5000 })
            .withMessage("Message too long (max 5000 characters)")
    ],
    validateRequest,
    sendMessage
);

router.put(
    "/messages/read/:messageId",
    protect,
    [
        param("messageId")
            .isMongoId()
            .withMessage("Valid message ID is required")
    ],
    validateRequest,
    markAsRead
);

module.exports = router;
