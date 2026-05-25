const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const toObjectId = (id) => mongoose.Types.ObjectId.createFromHexString(String(id));

const userRoom = (userId) => `user:${userId}`;
const chatRoom = (conversationId) => `chat:${conversationId}`;

const isParticipant = (conversation, userId) => (
    conversation?.participants || []
).some((participantId) => String(participantId) === String(userId));

const normalizeUnreadCounts = (conversation) => {
    if (!conversation?.unreadCounts) {
        return {};
    }

    return Object.fromEntries(conversation.unreadCounts);
};

const getUnreadCount = (conversation, userId) => {
    if (!conversation?.unreadCounts) {
        return 0;
    }

    return conversation.unreadCounts.get(String(userId)) || 0;
};

const normalizeMessageMap = (map) => {
    if (!map) {
        return {};
    }

    return Object.fromEntries(map);
};

const getFirstUnreadMessage = async ({ conversationId, userId }) => Message.findOne({
    conversationId,
    sender: { $ne: toObjectId(userId) },
    readBy: { $ne: toObjectId(userId) }
}).sort({ createdAt: 1 }).select("_id");

const buildConversationReadState = (conversation) => ({
    unreadCounts: normalizeUnreadCounts(conversation),
    lastReadMessage: normalizeMessageMap(conversation.lastReadMessage),
    lastVisibleMessage: normalizeMessageMap(conversation.lastVisibleMessage),
    unreadAnchorMessage: normalizeMessageMap(conversation.unreadAnchorMessage)
});

const buildMessagePayload = (message) => ({
    _id: message._id,
    conversationId: message.conversationId,
    sender: message.sender,
    text: message.text,
    attachments: message.attachments || [],
    readBy: message.readBy || [],
    seenBy: message.seenBy || [],
    isRead: Boolean(message.isRead),
    readAt: message.readAt,
    visibilityTracked: Boolean(message.visibilityTracked),
    createdAt: message.createdAt
});

const markMessagesRead = async ({ conversationId, userId, messageIds, lastVisibleMessageId }) => {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return null;
    }

    const validMessageIds = [...new Set(messageIds || [])]
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map(toObjectId);

    if (validMessageIds.length === 0) {
        return null;
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || !isParticipant(conversation, userId)) {
        return null;
    }

    const userObjectId = toObjectId(userId);
    const now = new Date();

    const messagesToRead = await Message.find({
        _id: { $in: validMessageIds },
        conversationId,
        sender: { $ne: userObjectId },
        readBy: { $ne: userObjectId }
    }).select("_id createdAt");

    if (messagesToRead.length === 0) {
        const firstRemainingUnread = await getFirstUnreadMessage({ conversationId, userId });
        if (lastVisibleMessageId && mongoose.Types.ObjectId.isValid(lastVisibleMessageId)) {
            conversation.lastVisibleMessage.set(String(userId), toObjectId(lastVisibleMessageId));
        }
        if (firstRemainingUnread) {
            conversation.unreadAnchorMessage.set(String(userId), firstRemainingUnread._id);
        } else {
            conversation.unreadAnchorMessage.delete(String(userId));
        }
        await conversation.save();

        return {
            conversation,
            messageIds: [],
            readByUserId: String(userId),
            readAt: now,
            unreadCount: getUnreadCount(conversation, userId),
            unreadAnchorMessageId: firstRemainingUnread?._id?.toString() || null,
            lastVisibleMessageId: lastVisibleMessageId || null,
            ...buildConversationReadState(conversation)
        };
    }

    const readMessageIds = messagesToRead.map((message) => message._id);

    const bulkResult = await Message.bulkWrite([
        {
            updateMany: {
                filter: {
                    _id: { $in: readMessageIds },
                    conversationId,
                    readBy: { $ne: userObjectId }
                },
                update: {
                    $addToSet: {
                        readBy: userObjectId,
                        seenBy: userObjectId
                    },
                    $set: {
                        isRead: true,
                        readAt: now,
                        visibilityTracked: true
                    }
                }
            }
        }
    ]);
    const modifiedCount = bulkResult.modifiedCount ?? readMessageIds.length;

    const unreadCount = await Message.countDocuments({
        conversationId,
        sender: { $ne: userObjectId },
        readBy: { $ne: userObjectId }
    });
    const latestRead = messagesToRead.reduce((latest, message) => (
        !latest || message.createdAt > latest.createdAt ? message : latest
    ), null);
    const firstRemainingUnread = await getFirstUnreadMessage({ conversationId, userId });

    conversation.unreadCounts.set(String(userId), unreadCount);
    conversation.lastSeenTimestamp.set(String(userId), now);
    if (latestRead) {
        conversation.lastReadMessage.set(String(userId), latestRead._id);
    }
    if (lastVisibleMessageId && mongoose.Types.ObjectId.isValid(lastVisibleMessageId)) {
        conversation.lastVisibleMessage.set(String(userId), toObjectId(lastVisibleMessageId));
    } else if (latestRead) {
        conversation.lastVisibleMessage.set(String(userId), latestRead._id);
    }
    if (firstRemainingUnread) {
        conversation.unreadAnchorMessage.set(String(userId), firstRemainingUnread._id);
    } else {
        conversation.unreadAnchorMessage.delete(String(userId));
    }
    await conversation.save();

    return {
        conversation,
        messageIds: modifiedCount > 0 ? readMessageIds.map(String) : [],
        readByUserId: String(userId),
        readAt: now,
        unreadCount,
        unreadAnchorMessageId: firstRemainingUnread?._id?.toString() || null,
        lastVisibleMessageId: lastVisibleMessageId || latestRead?._id?.toString() || null,
        ...buildConversationReadState(conversation)
    };
};

module.exports = {
    buildConversationReadState,
    buildMessagePayload,
    chatRoom,
    getFirstUnreadMessage,
    getUnreadCount,
    isParticipant,
    markMessagesRead,
    normalizeUnreadCounts,
    userRoom
};
