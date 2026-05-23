const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user.models");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// Per-socket rate limiting
const SOCKET_RATE_LIMIT_WINDOW = 60000;
const SOCKET_RATE_LIMIT_MAX = 30;

/**
 * Initialize Socket.IO on the given HTTP server.
 * Handles authentication, realtime messaging, typing indicators,
 * online/offline tracking, and read receipts.
 */
function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.NODE_ENV === "production"
                ? process.env.FRONTEND_URL || "https://skillsphere.vercel.app"
                : "*",
            credentials: true,
            methods: ["GET", "POST"]
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        maxHttpBufferSize: 1e6 // 1 MB max payload
    });

    // ─── Online user tracking: userId → socketId ───────────────────
    const onlineUsers = new Map();

    // ─── Socket rate limiting tracking ─────────────────────────────
    const socketRateLimits = new Map();

    // ─── JWT Authentication Middleware ─────────────────────────────
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.type && decoded.type !== "access") {
                return next(new Error("Invalid token type"));
            }

            const user = await User.findById(decoded.id).select("-password");

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.userId = user._id.toString();
            socket.userName = user.name;
            next();
        } catch (error) {
            next(new Error("Authentication failed"));
        }
    });

    // ─── Check socket rate limit ──────────────────────────────────
    function checkRateLimit(socketId) {
        const now = Date.now();
        const entry = socketRateLimits.get(socketId);

        if (!entry || now - entry.windowStart > SOCKET_RATE_LIMIT_WINDOW) {
            socketRateLimits.set(socketId, { windowStart: now, count: 1 });
            return true;
        }

        if (entry.count >= SOCKET_RATE_LIMIT_MAX) {
            return false;
        }

        entry.count++;
        return true;
    }

    // ─── Connection Handler ───────────────────────────────────────
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.userName} (${socket.userId})`);

        // Register user as online
        onlineUsers.set(socket.userId, socket.id);
        io.emit("user-online", { userId: socket.userId });

        // Send current list of online users to this socket
        socket.emit("online-users", Array.from(onlineUsers.keys()));

        // Explicit registration handler
        socket.on("register-user", (userId) => {
            if (userId) {
                const uid = String(userId);
                onlineUsers.set(uid, socket.id);
                socket.userId = uid;
                io.emit("user-online", { userId: uid });
                socket.emit("online-users", Array.from(onlineUsers.keys()));
            }
        });

        // ─── Send Message ─────────────────────────────────────────
        socket.on("send-message", async (data) => {
            try {
                const { conversationId, text } = data;

                // Rate limit check
                if (!checkRateLimit(socket.id)) {
                    socket.emit("error-message", {
                        message: "Too many messages. Please slow down."
                    });
                    return;
                }

                // Validate inputs
                if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
                    return;
                }

                if (!text || typeof text !== "string" || !text.trim() || text.length > 5000) {
                    return;
                }

                // Verify participation
                const conversation = await Conversation.findById(conversationId);

                if (!conversation) return;

                const isParticipant = conversation.participants.some(
                    (p) => p.toString() === socket.userId
                );

                if (!isParticipant) return;

                // Create message
                const message = await Message.create({
                    conversationId,
                    sender: socket.userId,
                    text: text.trim(),
                    readBy: [socket.userId]
                });

                // Update conversation
                conversation.lastMessage = message._id;
                conversation.lastMessageText = text.trim().substring(0, 100);
                conversation.updatedAt = new Date();

                for (const participantId of conversation.participants) {
                    if (participantId.toString() !== socket.userId) {
                        const currentCount = conversation.unreadCounts.get(participantId.toString()) || 0;
                        conversation.unreadCounts.set(participantId.toString(), currentCount + 1);
                    }
                }

                await conversation.save();

                // Populate sender info
                await message.populate("sender", "name profileImage profilePicture");

                const messagePayload = {
                    _id: message._id,
                    conversationId: message.conversationId,
                    sender: message.sender,
                    text: message.text,
                    readBy: message.readBy,
                    createdAt: message.createdAt
                };

                // Send to recipient if online
                for (const participantId of conversation.participants) {
                    const pid = participantId.toString();
                    if (pid !== socket.userId) {
                        const recipientSocketId = onlineUsers.get(pid);
                        if (recipientSocketId) {
                            io.to(recipientSocketId).emit("receive-message", messagePayload);
                            io.to(recipientSocketId).emit("conversation-updated", {
                                conversationId,
                                lastMessageText: conversation.lastMessageText,
                                updatedAt: conversation.updatedAt,
                                unreadCount: conversation.unreadCounts.get(pid) || 0
                            });
                        }
                    }
                }

                // Acknowledge to sender
                socket.emit("message-sent", messagePayload);
            } catch (error) {
                console.error("Socket send-message error:", error.message);
                socket.emit("error-message", {
                    message: "Failed to send message"
                });
            }
        });

        // ─── Typing Indicators ────────────────────────────────────
        socket.on("typing", (data) => {
            const { conversationId, recipientId } = data;

            if (!recipientId) return;

            const recipientSocketId = onlineUsers.get(recipientId);

            if (recipientSocketId) {
                io.to(recipientSocketId).emit("typing", {
                    conversationId,
                    userId: socket.userId,
                    userName: socket.userName
                });
            }
        });

        socket.on("stop-typing", (data) => {
            const { conversationId, recipientId } = data;

            if (!recipientId) return;

            const recipientSocketId = onlineUsers.get(recipientId);

            if (recipientSocketId) {
                io.to(recipientSocketId).emit("stop-typing", {
                    conversationId,
                    userId: socket.userId
                });
            }
        });

        // ─── Mark Read ────────────────────────────────────────────
        socket.on("mark-read", async (data) => {
            try {
                const { conversationId } = data;

                if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
                    return;
                }

                const conversation = await Conversation.findById(conversationId);

                if (!conversation) return;

                const isParticipant = conversation.participants.some(
                    (p) => p.toString() === socket.userId
                );

                if (!isParticipant) return;

                // Mark all unread messages in this conversation as read by this user
                await Message.updateMany(
                    {
                        conversationId,
                        readBy: { $ne: mongoose.Types.ObjectId.createFromHexString(socket.userId) }
                    },
                    {
                        $addToSet: { readBy: socket.userId }
                    }
                );

                // Reset unread count
                conversation.unreadCounts.set(socket.userId, 0);
                await conversation.save();

                // Notify the other participant about the read receipt
                for (const participantId of conversation.participants) {
                    const pid = participantId.toString();
                    if (pid !== socket.userId) {
                        const recipientSocketId = onlineUsers.get(pid);
                        if (recipientSocketId) {
                            io.to(recipientSocketId).emit("messages-read", {
                                conversationId,
                                readByUserId: socket.userId
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Socket mark-read error:", error.message);
            }
        });

        // ─── Disconnect ───────────────────────────────────────────
        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.userName} (${socket.userId})`);

            // Only remove if this is still the active socket for this user
            if (onlineUsers.get(socket.userId) === socket.id) {
                onlineUsers.delete(socket.userId);
                io.emit("user-offline", { userId: socket.userId });
            }

            socketRateLimits.delete(socket.id);
        });
    });

    // Cleanup stale rate limit entries periodically
    setInterval(() => {
        const now = Date.now();
        for (const [socketId, entry] of socketRateLimits) {
            if (now - entry.windowStart > SOCKET_RATE_LIMIT_WINDOW * 2) {
                socketRateLimits.delete(socketId);
            }
        }
    }, 300000);

    return io;
}

module.exports = initializeSocket;
