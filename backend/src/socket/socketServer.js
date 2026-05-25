const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user.models");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const {
    MAX_MESSAGE_TEXT_LENGTH,
    getLastMessageText,
    normalizeMessagePayload
} = require("../utils/messagePayload");
const {
    buildConversationReadState,
    buildMessagePayload,
    chatRoom,
    getFirstUnreadMessage,
    getUnreadCount,
    isParticipant,
    markMessagesRead,
    userRoom
} = require("../services/chatReadService");

const SOCKET_RATE_LIMIT_WINDOW = 60000;
const SOCKET_RATE_LIMIT_MAX = 30;

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
        maxHttpBufferSize: 1e6
    });

    const onlineUsers = new Map();
    const socketRateLimits = new Map();

    const addOnlineSocket = (userId, socketId) => {
        const key = String(userId);
        const sockets = onlineUsers.get(key) || new Set();
        sockets.add(socketId);
        onlineUsers.set(key, sockets);
    };

    const removeOnlineSocket = (userId, socketId) => {
        const key = String(userId);
        const sockets = onlineUsers.get(key);
        if (!sockets) return false;

        sockets.delete(socketId);
        if (sockets.size === 0) {
            onlineUsers.delete(key);
            return true;
        }

        return false;
    };

    const onlineUserIds = () => Array.from(onlineUsers.keys());

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
            return next();
        } catch (error) {
            return next(new Error("Authentication failed"));
        }
    });

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

    const emitUnreadUpdate = (conversation, userId) => {
        const payload = {
            conversationId: conversation._id.toString(),
            userId: String(userId),
            unreadCount: getUnreadCount(conversation, userId),
            ...buildConversationReadState(conversation),
            totalUnread: null
        };

        io.to(userRoom(userId)).emit("unread_count_updated", payload);
        io.to(userRoom(userId)).emit("notifications_updated", {
            unreadMessagesTotal: null,
            unreadPerChat: payload.unreadCounts,
            notificationsTotal: null
        });
    };

    const handleSendMessage = async (socket, data = {}) => {
        if (!checkRateLimit(socket.id)) {
            socket.emit("error-message", { message: "Too many messages. Please slow down." });
            return;
        }

        const { conversationId } = data;
        const { text, attachments, hasContent } = normalizeMessagePayload(data);

        if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) return;
        if (!hasContent || text.length > MAX_MESSAGE_TEXT_LENGTH) return;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation || !isParticipant(conversation, socket.userId)) return;

        const message = await Message.create({
            conversationId,
            sender: socket.userId,
            text,
            attachments,
            readBy: [socket.userId],
            seenBy: [socket.userId]
        });

        conversation.lastMessage = message._id;
        conversation.lastMessageText = getLastMessageText(text, attachments);
        conversation.updatedAt = new Date();

        for (const participantId of conversation.participants) {
            const pid = participantId.toString();
            if (pid !== socket.userId) {
                const currentUnread = getUnreadCount(conversation, pid);
                conversation.unreadCounts.set(pid, getUnreadCount(conversation, pid) + 1);
                if (currentUnread === 0) {
                    conversation.unreadAnchorMessage.set(pid, message._id);
                }
            } else {
                conversation.lastReadMessage.set(pid, message._id);
                conversation.lastVisibleMessage.set(pid, message._id);
                conversation.lastSeenTimestamp.set(pid, new Date());
            }
        }

        await conversation.save();
        await message.populate("sender", "name profileImage profilePicture");

        const messagePayload = buildMessagePayload(message);
        const chatPayload = {
            message: messagePayload,
            conversationId: conversation._id.toString(),
            lastMessageText: conversation.lastMessageText,
            updatedAt: conversation.updatedAt,
            ...buildConversationReadState(conversation)
        };

        for (const participantId of conversation.participants) {
            const pid = participantId.toString();
            io.to(userRoom(pid)).emit("new_message", {
                ...chatPayload,
                unreadCount: getUnreadCount(conversation, pid),
                isSender: pid === socket.userId
            });
            emitUnreadUpdate(conversation, pid);
        }

        io.to(chatRoom(conversationId)).emit("chat_updated", chatPayload);
        socket.emit("message-sent", messagePayload);
    };

    const handleMessagesRead = async (socket, data = {}) => {
        const { conversationId } = data;
        const messageIds = data.messageIds || (data.messageId ? [data.messageId] : []);
        const result = await markMessagesRead({
            conversationId,
            userId: socket.userId,
            messageIds,
            lastVisibleMessageId: data.lastVisibleMessageId || messageIds[messageIds.length - 1]
        });

        if (!result) return;

        const payload = {
            conversationId: result.conversation._id.toString(),
            messageIds: result.messageIds,
            readByUserId: result.readByUserId,
            readAt: result.readAt,
            unreadCount: result.unreadCount,
            unreadAnchorMessageId: result.unreadAnchorMessageId,
            lastVisibleMessageId: result.lastVisibleMessageId,
            unreadCounts: result.unreadCounts,
            lastReadMessage: result.lastReadMessage,
            lastVisibleMessage: result.lastVisibleMessage,
            unreadAnchorMessage: result.unreadAnchorMessage
        };

        io.to(chatRoom(conversationId)).emit("messages_read", payload);
        io.to(chatRoom(conversationId)).emit("messages-read", payload);

        for (const participantId of result.conversation.participants) {
            const pid = participantId.toString();
            io.to(userRoom(pid)).emit("messages_read", payload);
            if (pid === socket.userId) {
                emitUnreadUpdate(result.conversation, pid);
            }
        }
    };

    io.on("connection", (socket) => {
        addOnlineSocket(socket.userId, socket.id);
        socket.join(userRoom(socket.userId));

        io.emit("user_online_status", { userId: socket.userId, isOnline: true });
        io.emit("user-online", { userId: socket.userId });
        socket.emit("online-users", onlineUserIds());

        socket.on("register-user", (userId) => {
            const uid = String(userId || socket.userId);
            socket.userId = uid;
            socket.join(userRoom(uid));
            addOnlineSocket(uid, socket.id);
            io.emit("user_online_status", { userId: uid, isOnline: true });
            io.emit("user-online", { userId: uid });
            socket.emit("online-users", onlineUserIds());
        });

        socket.on("join_chat", async ({ conversationId } = {}) => {
            if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) return;

            const conversation = await Conversation.findById(conversationId);
            if (!conversation || !isParticipant(conversation, socket.userId)) return;

            socket.join(chatRoom(conversationId));
            socket.emit("unread_count_updated", {
                conversationId,
                userId: socket.userId,
                unreadCount: getUnreadCount(conversation, socket.userId),
                ...buildConversationReadState(conversation),
                totalUnread: null
            });
        });

        socket.on("open_chat", async ({ conversationId } = {}) => {
            if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) return;

            const conversation = await Conversation.findById(conversationId);
            if (!conversation || !isParticipant(conversation, socket.userId)) return;

            const firstUnread = await getFirstUnreadMessage({ conversationId, userId: socket.userId });
            if (firstUnread) {
                conversation.unreadAnchorMessage.set(socket.userId, firstUnread._id);
                await conversation.save();
            }

            socket.join(chatRoom(conversationId));
            socket.emit("chat_updated", {
                conversationId,
                unreadAnchorMessageId: firstUnread?._id?.toString() || null,
                unreadCount: getUnreadCount(conversation, socket.userId),
                ...buildConversationReadState(conversation)
            });
        });

        socket.on("leave_chat", ({ conversationId } = {}) => {
            if (conversationId) {
                socket.leave(chatRoom(conversationId));
            }
        });

        socket.on("send_message", (data) => {
            handleSendMessage(socket, data).catch((error) => {
                console.error("Socket send_message error:", error.message);
                socket.emit("error-message", { message: "Failed to send message" });
            });
        });

        socket.on("send-message", (data) => {
            handleSendMessage(socket, data).catch((error) => {
                console.error("Socket send-message error:", error.message);
                socket.emit("error-message", { message: "Failed to send message" });
            });
        });

        socket.on("message_seen", (data) => {
            handleMessagesRead(socket, data).catch((error) => {
                console.error("Socket message_seen error:", error.message);
            });
        });

        socket.on("message_visible", (data) => {
            handleMessagesRead(socket, data).catch((error) => {
                console.error("Socket message_visible error:", error.message);
            });
        });

        socket.on("mark_messages_read", (data) => {
            handleMessagesRead(socket, data).catch((error) => {
                console.error("Socket mark_messages_read error:", error.message);
            });
        });

        socket.on("mark-read", async (data = {}) => {
            if (!data.conversationId || !mongoose.Types.ObjectId.isValid(data.conversationId)) return;

            const unreadMessages = await Message.find({
                conversationId: data.conversationId,
                sender: { $ne: mongoose.Types.ObjectId.createFromHexString(socket.userId) },
                readBy: { $ne: mongoose.Types.ObjectId.createFromHexString(socket.userId) }
            }).select("_id");

            await handleMessagesRead(socket, {
                conversationId: data.conversationId,
                messageIds: unreadMessages.map((message) => message._id.toString())
            });
        });

        socket.on("typing_start", (data = {}) => {
            const payload = {
                conversationId: data.conversationId,
                userId: socket.userId,
                userName: socket.userName,
                isTyping: true
            };
            if (data.recipientId) {
                io.to(userRoom(data.recipientId)).emit("typing_status", payload);
                io.to(userRoom(data.recipientId)).emit("typing", payload);
            }
            socket.to(chatRoom(data.conversationId)).emit("typing_status", payload);
            socket.to(chatRoom(data.conversationId)).emit("typing", payload);
        });

        socket.on("typing", (data = {}) => {
            const recipientId = data.recipientId;
            const payload = {
                conversationId: data.conversationId,
                userId: socket.userId,
                userName: socket.userName,
                isTyping: true
            };
            if (recipientId) {
                io.to(userRoom(recipientId)).emit("typing_status", payload);
                io.to(userRoom(recipientId)).emit("typing", payload);
            }
            socket.to(chatRoom(data.conversationId)).emit("typing_status", payload);
        });

        socket.on("typing_stop", (data = {}) => {
            const payload = {
                conversationId: data.conversationId,
                userId: socket.userId,
                userName: socket.userName,
                isTyping: false
            };
            if (data.recipientId) {
                io.to(userRoom(data.recipientId)).emit("typing_status", payload);
                io.to(userRoom(data.recipientId)).emit("stop-typing", payload);
            }
            socket.to(chatRoom(data.conversationId)).emit("typing_status", payload);
            socket.to(chatRoom(data.conversationId)).emit("stop-typing", payload);
        });

        socket.on("stop-typing", (data = {}) => {
            const recipientId = data.recipientId;
            const payload = {
                conversationId: data.conversationId,
                userId: socket.userId,
                userName: socket.userName,
                isTyping: false
            };
            if (recipientId) {
                io.to(userRoom(recipientId)).emit("typing_status", payload);
                io.to(userRoom(recipientId)).emit("stop-typing", payload);
            }
            socket.to(chatRoom(data.conversationId)).emit("typing_status", payload);
        });

        socket.on("disconnect", () => {
            const wentOffline = removeOnlineSocket(socket.userId, socket.id);
            socketRateLimits.delete(socket.id);

            if (wentOffline) {
                io.emit("user_online_status", { userId: socket.userId, isOnline: false });
                io.emit("user-offline", { userId: socket.userId });
            }
        });
    });

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
