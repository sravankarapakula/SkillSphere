import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as messageApi from "../../api/messageApi";

const normalizeUnreadCounts = (counts) => {
    if (!counts) return {};
    if (typeof counts.get === "function") {
        return Object.fromEntries(counts);
    }
    return { ...counts };
};

const normalizeIdMap = (map) => {
    if (!map) return {};
    if (typeof map.get === "function") {
        return Object.fromEntries(map);
    }
    return { ...map };
};

const getUserId = (user) => user?._id || user?.id;

const getSenderId = (message) => String(message?.sender?._id || message?.sender || "");

const isMessageReadBy = (message, userId) => (
    message?.readBy || []
).some((id) => String(id?._id || id) === String(userId));

const findFirstUnreadId = (messages = [], currentUserId) => {
    if (!currentUserId) return null;

    const firstUnread = messages.find(
        (message) => getSenderId(message) !== String(currentUserId) && !isMessageReadBy(message, currentUserId)
    );

    return firstUnread?._id || null;
};

const recalculateTotalUnread = (state, currentUserId) => {
    if (!currentUserId) {
        state.totalUnread = 0;
        state.unreadMessagesTotal = 0;
        state.unreadPerChat = {};
        state.activeChatUnread = 0;
        state.notificationsTotal = state.globalNotificationsTotal;
        return;
    }

    state.unreadPerChat = {};
    state.unreadMessagesTotal = state.conversations.reduce((total, conversation) => {
        const counts = normalizeUnreadCounts(conversation.unreadCounts);
        const count = counts[String(currentUserId)] || 0;
        state.unreadPerChat[String(conversation._id)] = count;
        return total + count;
    }, 0);
    state.totalUnread = state.unreadMessagesTotal;
    state.activeChatUnread = state.activeConversationId
        ? state.unreadPerChat[String(state.activeConversationId)] || 0
        : 0;
    state.notificationsTotal = state.globalNotificationsTotal + state.unreadMessagesTotal;
};

const upsertMessage = (state, message) => {
    const conversationId = String(message.conversationId);
    if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
    }

    const index = state.messages[conversationId].findIndex((existing) => String(existing._id) === String(message._id));
    if (index >= 0) {
        state.messages[conversationId][index] = {
            ...state.messages[conversationId][index],
            ...message,
            readBy: message.readBy || state.messages[conversationId][index].readBy || [],
            seenBy: message.seenBy || state.messages[conversationId][index].seenBy || []
        };
    } else {
        state.messages[conversationId].push(message);
        state.messages[conversationId].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
};

const applyConversationPatch = (state, payload, currentUserId) => {
    const conversationId = String(payload.conversationId);
    const conversation = state.conversations.find((item) => String(item._id) === conversationId);

    if (conversation) {
        if (payload.lastMessageText !== undefined) conversation.lastMessageText = payload.lastMessageText;
        if (payload.lastMessage !== undefined) conversation.lastMessage = payload.lastMessage;
        if (payload.updatedAt !== undefined) conversation.updatedAt = payload.updatedAt;
        if (payload.unreadCounts) conversation.unreadCounts = normalizeUnreadCounts(payload.unreadCounts);
        if (payload.lastReadMessage) conversation.lastReadMessage = normalizeIdMap(payload.lastReadMessage);
        if (payload.lastVisibleMessage) conversation.lastVisibleMessage = normalizeIdMap(payload.lastVisibleMessage);
        if (payload.unreadAnchorMessage) conversation.unreadAnchorMessage = normalizeIdMap(payload.unreadAnchorMessage);
        if (payload.projectId !== undefined) conversation.projectId = payload.projectId;
        if (payload.conversationType !== undefined) conversation.conversationType = payload.conversationType;
        if (payload.unreadAnchorMessageId !== undefined && currentUserId) {
            conversation.unreadAnchorMessage = normalizeIdMap(conversation.unreadAnchorMessage);
            if (payload.unreadAnchorMessageId) {
                conversation.unreadAnchorMessage[String(currentUserId)] = payload.unreadAnchorMessageId;
            } else {
                delete conversation.unreadAnchorMessage[String(currentUserId)];
            }
        }
        if (payload.unreadCount !== undefined && currentUserId) {
            conversation.unreadCounts = normalizeUnreadCounts(conversation.unreadCounts);
            conversation.unreadCounts[String(currentUserId)] = payload.unreadCount;
        }
    }

    state.conversations.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    recalculateTotalUnread(state, currentUserId);
};

export const fetchConversations = createAsyncThunk(
    "message/fetchConversations",
    async (_, thunkAPI) => {
        try {
            const data = await messageApi.getConversations();
            const currentUserId = getUserId(thunkAPI.getState().auth.user);
            const conversations = data.data.conversations.map((conversation) => ({
                ...conversation,
                unreadCounts: normalizeUnreadCounts(conversation.unreadCounts),
                lastReadMessage: normalizeIdMap(conversation.lastReadMessage),
                lastVisibleMessage: normalizeIdMap(conversation.lastVisibleMessage),
                unreadAnchorMessage: normalizeIdMap(conversation.unreadAnchorMessage)
            }));

            return { conversations, currentUserId };
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to fetch conversations";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const fetchMessages = createAsyncThunk(
    "message/fetchMessages",
    async ({ conversationId, page = 1 }, thunkAPI) => {
        try {
            const data = await messageApi.getMessages(conversationId, page);
            const currentUserId = getUserId(thunkAPI.getState().auth.user);
            return {
                conversationId,
                messages: data.data.messages,
                currentPage: data.data.currentPage,
                hasMore: data.data.hasMore,
                unreadAnchorMessageId: data.data.unreadAnchorMessageId,
                unreadCount: data.data.unreadCount,
                readState: data.data.readState,
                currentUserId
            };
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to fetch messages";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const initialState = {
    conversations: [],
    activeConversationId: null,
    messages: {},
    unreadDividerMessageId: {},
    unreadAnchorMessage: {},
    isLoadingConversations: false,
    isLoadingMessages: false,
    hasMore: {},
    currentPage: {},
    totalUnread: 0,
    unreadMessagesTotal: 0,
    unreadPerChat: {},
    activeChatUnread: 0,
    notificationsTotal: 0,
    globalNotificationsTotal: 0,
    notificationItems: [],
    onlineUsers: [],
    typingUsers: {},
    socketConnected: false,
    pendingReadMessageIds: {}
};

const messageSlice = createSlice({
    name: "message",
    initialState,
    reducers: {
        setActiveConversation: (state, action) => {
            state.activeConversationId = action.payload;
            state.activeChatUnread = action.payload
                ? state.unreadPerChat[String(action.payload)] || 0
                : 0;
        },
        setSocketConnected: (state, action) => {
            state.socketConnected = Boolean(action.payload);
        },
        addMessage: (state, action) => {
            upsertMessage(state, action.payload);
        },
        receiveSocketMessage: (state, action) => {
            const { message, currentUserId, unreadCount, unreadCounts, lastMessageText, updatedAt, isSender } = action.payload;
            upsertMessage(state, message);
            applyConversationPatch(state, {
                conversationId: message.conversationId,
                lastMessage: message._id,
                lastMessageText: lastMessageText ?? message.text,
                updatedAt: updatedAt ?? message.createdAt,
                unreadCount,
                unreadCounts
            }, currentUserId);

            if (!isSender && currentUserId) {
                state.unreadDividerMessageId[String(message.conversationId)] = (
                    state.unreadDividerMessageId[String(message.conversationId)]
                    || findFirstUnreadId(state.messages[String(message.conversationId)], currentUserId)
                );
            }
        },
        applyChatUpdate: (state, action) => {
            applyConversationPatch(state, action.payload, action.payload.currentUserId);
            const { conversationId, currentUserId, unreadAnchorMessageId } = action.payload;
            if (unreadAnchorMessageId !== undefined && currentUserId) {
                if (unreadAnchorMessageId) {
                    state.unreadDividerMessageId[String(conversationId)] = unreadAnchorMessageId;
                    state.unreadAnchorMessage[String(conversationId)] = unreadAnchorMessageId;
                } else {
                    delete state.unreadDividerMessageId[String(conversationId)];
                    delete state.unreadAnchorMessage[String(conversationId)];
                }
            }
        },
        applyUnreadCountUpdate: (state, action) => {
            const {
                conversationId,
                currentUserId,
                unreadCount,
                unreadCounts,
                unreadAnchorMessage,
                unreadAnchorMessageId
            } = action.payload;
            const conversation = state.conversations.find((item) => String(item._id) === String(conversationId));
            if (conversation) {
                conversation.unreadCounts = unreadCounts
                    ? normalizeUnreadCounts(unreadCounts)
                    : normalizeUnreadCounts(conversation.unreadCounts);
                if (unreadAnchorMessage) {
                    conversation.unreadAnchorMessage = normalizeIdMap(unreadAnchorMessage);
                }
                if (currentUserId && unreadCount !== undefined) {
                    conversation.unreadCounts[String(currentUserId)] = unreadCount;
                }
            }
            recalculateTotalUnread(state, currentUserId);

            if (unreadAnchorMessageId) {
                state.unreadDividerMessageId[String(conversationId)] = unreadAnchorMessageId;
                state.unreadAnchorMessage[String(conversationId)] = unreadAnchorMessageId;
            } else if (unreadCount === 0) {
                delete state.unreadDividerMessageId[String(conversationId)];
                delete state.unreadAnchorMessage[String(conversationId)];
            }
        },
        applyNotificationsUpdate: (state, action) => {
            const { notificationItems, globalNotificationsTotal, notificationsTotal } = action.payload;
            if (Array.isArray(notificationItems)) {
                state.notificationItems = notificationItems;
            }
            if (globalNotificationsTotal !== undefined) {
                state.globalNotificationsTotal = globalNotificationsTotal;
            }
            if (notificationsTotal !== null && notificationsTotal !== undefined) {
                state.notificationsTotal = notificationsTotal;
            } else {
                state.notificationsTotal = state.globalNotificationsTotal + state.unreadMessagesTotal;
            }
        },
        markMessagesReadOptimistic: (state, action) => {
            const { conversationId, messageIds, currentUserId } = action.payload;
            const ids = new Set((messageIds || []).map(String));
            const messages = state.messages[String(conversationId)] || [];

            messages.forEach((message) => {
                if (ids.has(String(message._id)) && !isMessageReadBy(message, currentUserId)) {
                    message.readBy = [...(message.readBy || []), currentUserId];
                    message.seenBy = [...(message.seenBy || []), currentUserId];
                    message.isRead = true;
                    message.readAt = new Date().toISOString();
                }
            });

            const conversation = state.conversations.find((item) => String(item._id) === String(conversationId));
            if (conversation) {
                conversation.unreadCounts = normalizeUnreadCounts(conversation.unreadCounts);
                const current = conversation.unreadCounts[String(currentUserId)] || 0;
                conversation.unreadCounts[String(currentUserId)] = Math.max(current - ids.size, 0);
            }

            state.unreadDividerMessageId[String(conversationId)] = findFirstUnreadId(messages, currentUserId);
            if (!state.unreadDividerMessageId[String(conversationId)]) {
                delete state.unreadDividerMessageId[String(conversationId)];
                delete state.unreadAnchorMessage[String(conversationId)];
            } else {
                state.unreadAnchorMessage[String(conversationId)] = state.unreadDividerMessageId[String(conversationId)];
            }
            recalculateTotalUnread(state, currentUserId);
        },
        applyMessagesRead: (state, action) => {
            const { conversationId, messageIds, readByUserId, readAt, currentUserId, unreadCount, unreadCounts } = action.payload;
            const messages = state.messages[String(conversationId)] || [];
            const ids = new Set((messageIds || []).map(String));

            messages.forEach((message) => {
                if (ids.has(String(message._id)) && !isMessageReadBy(message, readByUserId)) {
                    message.readBy = [...(message.readBy || []), readByUserId];
                    message.seenBy = [...(message.seenBy || []), readByUserId];
                    message.isRead = true;
                    message.readAt = readAt || message.readAt;
                }
            });

            const conversation = state.conversations.find((item) => String(item._id) === String(conversationId));
            if (conversation) {
                conversation.unreadCounts = unreadCounts
                    ? normalizeUnreadCounts(unreadCounts)
                    : normalizeUnreadCounts(conversation.unreadCounts);
                if (String(readByUserId) === String(currentUserId) && unreadCount !== undefined) {
                    conversation.unreadCounts[String(currentUserId)] = unreadCount;
                }
                if (action.payload.lastReadMessage) {
                    conversation.lastReadMessage = normalizeIdMap(action.payload.lastReadMessage);
                }
                if (action.payload.lastVisibleMessage) {
                    conversation.lastVisibleMessage = normalizeIdMap(action.payload.lastVisibleMessage);
                }
                if (action.payload.unreadAnchorMessage) {
                    conversation.unreadAnchorMessage = normalizeIdMap(action.payload.unreadAnchorMessage);
                }
            }

            state.unreadDividerMessageId[String(conversationId)] = action.payload.unreadAnchorMessageId
                || findFirstUnreadId(messages, currentUserId);
            if (!state.unreadDividerMessageId[String(conversationId)]) {
                delete state.unreadDividerMessageId[String(conversationId)];
                delete state.unreadAnchorMessage[String(conversationId)];
            } else {
                state.unreadAnchorMessage[String(conversationId)] = state.unreadDividerMessageId[String(conversationId)];
            }
            recalculateTotalUnread(state, currentUserId);
        },
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload.map(String);
        },
        addUserOnline: (state, action) => {
            const userId = String(action.payload);
            if (!state.onlineUsers.includes(userId)) {
                state.onlineUsers.push(userId);
            }
        },
        removeUserOffline: (state, action) => {
            state.onlineUsers = state.onlineUsers.filter((id) => String(id) !== String(action.payload));
        },
        setTyping: (state, action) => {
            const { conversationId, userId, userName, isTyping } = action.payload;
            if (!conversationId) return;

            if (!state.typingUsers[conversationId]) {
                state.typingUsers[conversationId] = [];
            }

            if (isTyping) {
                const exists = state.typingUsers[conversationId].some((user) => String(user.userId) === String(userId));
                if (!exists) {
                    state.typingUsers[conversationId].push({ userId, userName });
                }
            } else {
                state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
                    (user) => String(user.userId) !== String(userId)
                );
            }
        },
        addNewConversation: (state, action) => {
            const conversation = {
                ...action.payload,
                unreadCounts: normalizeUnreadCounts(action.payload.unreadCounts),
                lastReadMessage: normalizeIdMap(action.payload.lastReadMessage),
                lastVisibleMessage: normalizeIdMap(action.payload.lastVisibleMessage),
                unreadAnchorMessage: normalizeIdMap(action.payload.unreadAnchorMessage)
            };
            const exists = state.conversations.some((item) => String(item._id) === String(conversation._id));
            if (!exists) {
                state.conversations.unshift(conversation);
            }
        },
        clearMessageState: () => initialState
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchConversations.pending, (state) => {
                state.isLoadingConversations = true;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.isLoadingConversations = false;
                state.conversations = action.payload.conversations;
                recalculateTotalUnread(state, action.payload.currentUserId);
            })
            .addCase(fetchConversations.rejected, (state) => {
                state.isLoadingConversations = false;
            })
            .addCase(fetchMessages.pending, (state) => {
                state.isLoadingMessages = true;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.isLoadingMessages = false;
                const {
                    conversationId,
                    messages,
                    currentPage,
                    hasMore,
                    currentUserId,
                    unreadAnchorMessageId,
                    unreadCount,
                    readState
                } = action.payload;
                const key = String(conversationId);

                if (!state.messages[key] || currentPage === 1) {
                    state.messages[key] = messages;
                } else {
                    const existingIds = new Set(state.messages[key].map((message) => String(message._id)));
                    const newMessages = messages.filter((message) => !existingIds.has(String(message._id)));
                    state.messages[key] = [...newMessages, ...state.messages[key]];
                }

                state.currentPage[key] = currentPage;
                state.hasMore[key] = hasMore;
                const conversation = state.conversations.find((item) => String(item._id) === key);
                if (conversation && readState) {
                    conversation.unreadCounts = normalizeUnreadCounts(readState.unreadCounts);
                    conversation.lastReadMessage = normalizeIdMap(readState.lastReadMessage);
                    conversation.lastVisibleMessage = normalizeIdMap(readState.lastVisibleMessage);
                    conversation.unreadAnchorMessage = normalizeIdMap(readState.unreadAnchorMessage);
                    if (unreadCount !== undefined) {
                        conversation.unreadCounts[String(currentUserId)] = unreadCount;
                    }
                }
                state.unreadDividerMessageId[key] = unreadAnchorMessageId
                    || findFirstUnreadId(state.messages[key], currentUserId);
                if (!state.unreadDividerMessageId[key]) {
                    delete state.unreadDividerMessageId[key];
                    delete state.unreadAnchorMessage[key];
                } else {
                    state.unreadAnchorMessage[key] = state.unreadDividerMessageId[key];
                }
                recalculateTotalUnread(state, currentUserId);
            })
            .addCase(fetchMessages.rejected, (state) => {
                state.isLoadingMessages = false;
            });
    }
});

export const {
    setActiveConversation,
    setSocketConnected,
    addMessage,
    receiveSocketMessage,
    applyChatUpdate,
    applyUnreadCountUpdate,
    applyNotificationsUpdate,
    markMessagesReadOptimistic,
    applyMessagesRead,
    setOnlineUsers,
    addUserOnline,
    removeUserOffline,
    setTyping,
    addNewConversation,
    clearMessageState
} = messageSlice.actions;

export const selectUnreadMessagesTotal = (state) => state.message.unreadMessagesTotal;
export const selectUnreadPerChat = (state) => state.message.unreadPerChat;
export const selectNotificationsTotal = (state) => state.message.notificationsTotal;
export const selectActiveChatUnread = (state) => state.message.activeChatUnread;
export const selectUnreadAnchorMessage = (conversationId) => (state) => (
    state.message.unreadAnchorMessage[String(conversationId)]
    || state.message.unreadDividerMessageId[String(conversationId)]
    || null
);

export default messageSlice.reducer;
