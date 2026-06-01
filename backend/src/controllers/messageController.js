const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Proposal = require("../models/Proposal.models");
const Gig = require("../models/Gig.models");
const asyncHandler = require("../utils/asynchandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const {
    MAX_MESSAGE_TEXT_LENGTH,
    getLastMessageText,
    normalizeMessagePayload
} = require("../utils/messagePayload");
const {
    buildConversationReadState,
    buildMessagePayload,
    enrichConversation,
    getFirstUnreadMessage,
    markMessagesRead
} = require("../services/chatReadService");

const MESSAGES_PER_PAGE = 30;

/**
 * POST /api/conversations/create
 * Client creates a conversation for a proposal (opens discussion).
 * Reuses existing conversation if one already exists for this proposal.
 */
const createConversation = asyncHandler(async (req, res) => {
    const { proposalId } = req.body;

    if (!proposalId || !mongoose.Types.ObjectId.isValid(proposalId)) {
        return errorResponse(res, "Valid proposalId is required", 400);
    }

    // Find the proposal and verify ownership (need gig client to check ownership and title for snapshot)
    const proposal = await Proposal.findById(proposalId).populate("gig", "client title");

    if (!proposal) {
        return errorResponse(res, "Proposal not found", 404);
    }

    // Check if a conversation already exists for this proposal
    const existingConversation = await Conversation.findOne({ proposalId })
        .populate("participants", "name email profileImage profilePicture role");

    if (existingConversation) {
        // Verify req.user._id is a participant in the conversation
        const isUserParticipant = existingConversation.participants.some(
            (p) => p._id.toString() === req.user._id.toString()
        );
        if (!isUserParticipant) {
            return errorResponse(res, "Access denied", 403);
        }

        if (!existingConversation.gigTitle) {
            await existingConversation.populate({
                path: "proposalId",
                populate: { path: "gig", select: "title" }
            });
        }
        return successResponse(res, { conversation: enrichConversation(existingConversation, req.user._id) }, "Conversation already exists");
    }

    // Only the gig owner (client) can open a discussion (create it)
    if (proposal.gig.client.toString() !== req.user._id.toString()) {
        return errorResponse(res, "Only the gig owner can open a discussion", 403);
    }

    // Create the conversation
    const conversation = await Conversation.create({
        participants: [proposal.gig.client, proposal.freelancer],
        proposalId: proposalId,
        clientId: proposal.gig.client,
        freelancerId: proposal.freelancer,
        gigId: proposal.gig._id,
        gigTitle: proposal.gig.title || "",
        projectId: null,
        conversationType: "proposal",
        unreadCounts: new Map([
            [proposal.gig.client.toString(), 0],
            [proposal.freelancer.toString(), 0]
        ]),
        unreadAnchorMessage: new Map(),
        lastVisibleMessage: new Map(),
        lastReadMessage: new Map(),
        lastSeenTimestamp: new Map([
            [proposal.gig.client.toString(), new Date()],
            [proposal.freelancer.toString(), new Date()]
        ])
    });

    // Update proposal status to "discussion" if it's still pending/submitted/shortlisted
    if (["pending", "submitted", "shortlisted"].includes(proposal.status)) {
        proposal.status = "discussion";
        await proposal.save();
    }

    // Populate participants for the response
    await conversation.populate("participants", "name email profileImage profilePicture role");

    return successResponse(res, { conversation: enrichConversation(conversation, req.user._id) }, "Conversation created", 201);
});

const getConversations = asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({
        participants: req.user._id
    })
        .populate("participants", "name email profileImage profilePicture role")
        .populate({
            path: "proposalId",
            populate: { path: "gig", select: "title" }
        })
        .sort({ updatedAt: -1 });

    return successResponse(res, {
        conversations: conversations.map((conversation) => enrichConversation(conversation, req.user._id))
    });
});

/**
 * GET /api/messages/:conversationId
 * Fetch paginated messages for a conversation.
 * Newest messages first (reversed on the client for display).
 */
const getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return errorResponse(res, "Invalid conversation ID", 400);
    }

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        return errorResponse(res, "Conversation not found", 404);
    }

    const isParticipant = conversation.participants.some(
        (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
        return errorResponse(res, "Access denied", 403);
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = MESSAGES_PER_PAGE;
    const skip = (page - 1) * limit;

    const totalMessages = await Message.countDocuments({ conversationId });
    const totalPages = Math.ceil(totalMessages / limit);

    const messages = await Message.find({ conversationId })
        .populate("sender", "name profileImage profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Reverse so newest are at the bottom for display
    messages.reverse();
    const firstUnread = await getFirstUnreadMessage({
        conversationId,
        userId: req.user._id.toString()
    });

    return successResponse(res, {
        messages,
        currentPage: page,
        totalPages,
        hasMore: page < totalPages,
        unreadAnchorMessageId: firstUnread?._id?.toString() || null,
        unreadCount: conversation.unreadCounts.get(req.user._id.toString()) || 0,
        readState: buildConversationReadState(conversation)
    });
});

/**
 * POST /api/messages/send
 * Send a message in an existing conversation.
 */
const sendMessage = asyncHandler(async (req, res) => {
    const { conversationId } = req.body;
    const { text, attachments, hasContent } = normalizeMessagePayload(req.body);

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
        return errorResponse(res, "Valid conversationId is required", 400);
    }

    if (!hasContent) {
        return errorResponse(res, "Message text or attachment is required", 400);
    }

    if (text.length > MAX_MESSAGE_TEXT_LENGTH) {
        return errorResponse(res, "Message text exceeds maximum length of 5000 characters", 400);
    }

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        return errorResponse(res, "Conversation not found", 404);
    }

    const isParticipant = conversation.participants.some(
        (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
        return errorResponse(res, "Access denied", 403);
    }

    // Create the message
    const message = await Message.create({
        conversationId,
        sender: req.user._id,
        text,
        attachments,
        readBy: [req.user._id],
        seenBy: [req.user._id],
        visibilityTracked: true
    });

    // Update conversation metadata
    conversation.lastMessage = message._id;
    conversation.lastMessageText = getLastMessageText(text, attachments);
    conversation.updatedAt = new Date();

    // Increment unread count for the other participant
    for (const participantId of conversation.participants) {
        if (participantId.toString() !== req.user._id.toString()) {
            const currentCount = conversation.unreadCounts.get(participantId.toString()) || 0;
            conversation.unreadCounts.set(participantId.toString(), currentCount + 1);
            if (currentCount === 0) {
                conversation.unreadAnchorMessage.set(participantId.toString(), message._id);
            }
        } else {
            conversation.lastReadMessage.set(participantId.toString(), message._id);
            conversation.lastVisibleMessage.set(participantId.toString(), message._id);
        }
    }

    await conversation.save();

    // Populate sender info for the response
    await message.populate("sender", "name profileImage profilePicture");

    return successResponse(res, { message: buildMessagePayload(message) }, "Message sent", 201);
});

/**
 * PUT /api/messages/read/:messageId
 * Mark a message as read and reset unread count for the user in the conversation.
 */
const markAsRead = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return errorResponse(res, "Invalid message ID", 400);
    }

    const message = await Message.findById(messageId);

    if (!message) {
        return errorResponse(res, "Message not found", 404);
    }

    // Verify user is a participant in the conversation
    const conversation = await Conversation.findById(message.conversationId);

    if (!conversation) {
        return errorResponse(res, "Conversation not found", 404);
    }

    const isParticipant = conversation.participants.some(
        (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
        return errorResponse(res, "Access denied", 403);
    }

    await markMessagesRead({
        conversationId: message.conversationId.toString(),
        userId: req.user._id.toString(),
        messageIds: [messageId]
    });

    return successResponse(res, null, "Message marked as read");
});

module.exports = {
    createConversation,
    getConversations,
    getMessages,
    sendMessage,
    markAsRead
};
