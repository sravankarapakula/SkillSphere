import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as messageApi from "../../api/messageApi";

export const fetchConversations = createAsyncThunk(
    "message/fetchConversations",
    async (_, thunkAPI) => {
        try {
            const data = await messageApi.getConversations();
            const currentUserId = thunkAPI.getState().auth.user?._id;
            const conversations = data.data.conversations;
            let totalUnread = 0;
            if (currentUserId) {
                totalUnread = conversations.reduce((total, conv) => {
                    const count = conv.unreadCounts?.[currentUserId] || 0;
                    return total + count;
                }, 0);
            }
            return { conversations, totalUnread };
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
            return {
                conversationId,
                messages: data.data.messages,
                currentPage: data.data.currentPage,
                hasMore: data.data.hasMore
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
    messages: {}, // { [conversationId]: [] }
    isLoadingConversations: false,
    isLoadingMessages: false,
    hasMore: {}, // { [conversationId]: false }
    currentPage: {}, // { [conversationId]: 1 }
    totalUnread: 0,
    onlineUsers: [], // Array of userIds
    typingUsers: {} // { [conversationId]: [{ userId, userName }] }
};

const messageSlice = createSlice({
    name: "message",
    initialState,
    reducers: {
        setActiveConversation: (state, action) => {
            state.activeConversationId = action.payload;
        },
        addMessage: (state, action) => {
            const { conversationId } = action.payload;
            if (!state.messages[conversationId]) {
                state.messages[conversationId] = [];
            }
            const exists = state.messages[conversationId].some(
                (m) => String(m._id) === String(action.payload._id)
            );
            if (!exists) {
                state.messages[conversationId].push(action.payload);
            }
        },
        updateConversationOnNewMessage: (state, action) => {
            const { conversationId, lastMessageText, updatedAt, currentUserId, isSender } = action.payload;
            const conversation = state.conversations.find((c) => String(c._id) === String(conversationId));
            if (conversation) {
                conversation.lastMessageText = lastMessageText;
                conversation.updatedAt = updatedAt;
                if (!isSender && currentUserId) {
                    const currentCount = conversation.unreadCounts?.[String(currentUserId)] || 0;
                    if (!conversation.unreadCounts) {
                        conversation.unreadCounts = {};
                    }
                    conversation.unreadCounts[String(currentUserId)] = currentCount + 1;
                }
                state.conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            }
            if (currentUserId) {
                state.totalUnread = state.conversations.reduce((total, conv) => {
                    const count = conv.unreadCounts?.[String(currentUserId)] || 0;
                    return total + count;
                }, 0);
            }
        },
        markConversationRead: (state, action) => {
            const { conversationId, currentUserId } = action.payload;
            const conversation = state.conversations.find((c) => String(c._id) === String(conversationId));
            if (conversation) {
                if (!conversation.unreadCounts) {
                    conversation.unreadCounts = {};
                }
                conversation.unreadCounts[String(currentUserId)] = 0;
            }
            if (currentUserId) {
                state.totalUnread = state.conversations.reduce((total, conv) => {
                    const count = conv.unreadCounts?.[String(currentUserId)] || 0;
                    return total + count;
                }, 0);
            }
            if (state.messages[conversationId]) {
                state.messages[conversationId] = state.messages[conversationId].map((msg) => {
                    if (!msg.readBy.some((id) => String(id) === String(currentUserId))) {
                        return { ...msg, readBy: [...msg.readBy, String(currentUserId)] };
                    }
                    return msg;
                });
            }
        },
        updateMessageReadBy: (state, action) => {
            const { conversationId, readByUserId } = action.payload;
            if (state.messages[conversationId]) {
                state.messages[conversationId] = state.messages[conversationId].map((msg) => {
                    if (!msg.readBy.some((id) => String(id) === String(readByUserId))) {
                        return { ...msg, readBy: [...msg.readBy, String(readByUserId)] };
                    }
                    return msg;
                });
            }
        },
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload;
        },
        addUserOnline: (state, action) => {
            const payloadStr = String(action.payload);
            if (!state.onlineUsers.some((id) => String(id) === payloadStr)) {
                state.onlineUsers.push(payloadStr);
            }
        },
        removeUserOffline: (state, action) => {
            state.onlineUsers = state.onlineUsers.filter((id) => String(id) !== String(action.payload));
        },
        setTyping: (state, action) => {
            const { conversationId, userId, userName, isTyping } = action.payload;
            if (!state.typingUsers[conversationId]) {
                state.typingUsers[conversationId] = [];
            }
            if (isTyping) {
                const exists = state.typingUsers[conversationId].some((u) => String(u.userId) === String(userId));
                if (!exists) {
                    state.typingUsers[conversationId].push({ userId, userName });
                }
            } else {
                state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
                    (u) => String(u.userId) !== String(userId)
                );
            }
        },
        addNewConversation: (state, action) => {
            const exists = state.conversations.some((c) => String(c._id) === String(action.payload._id));
            if (!exists) {
                state.conversations.unshift(action.payload);
            }
        },
        clearMessageState: (state) => {
            return initialState;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchConversations.pending, (state) => {
                state.isLoadingConversations = true;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.isLoadingConversations = false;
                state.conversations = action.payload.conversations;
                state.totalUnread = action.payload.totalUnread;
            })
            .addCase(fetchConversations.rejected, (state) => {
                state.isLoadingConversations = false;
            })
            .addCase(fetchMessages.pending, (state) => {
                state.isLoadingMessages = true;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.isLoadingMessages = false;
                const { conversationId, messages, currentPage, hasMore } = action.payload;
                if (!state.messages[conversationId] || currentPage === 1) {
                    state.messages[conversationId] = messages;
                } else {
                    const existingIds = new Set(state.messages[conversationId].map((m) => m._id));
                    const newMessages = messages.filter((m) => !existingIds.has(m._id));
                    state.messages[conversationId] = [...newMessages, ...state.messages[conversationId]];
                }
                state.currentPage[conversationId] = currentPage;
                state.hasMore[conversationId] = hasMore;
            })
            .addCase(fetchMessages.rejected, (state) => {
                state.isLoadingMessages = false;
            });
    }
});

export const {
    setActiveConversation,
    addMessage,
    updateConversationOnNewMessage,
    markConversationRead,
    updateMessageReadBy,
    setOnlineUsers,
    addUserOnline,
    removeUserOffline,
    setTyping,
    addNewConversation,
    clearMessageState
} = messageSlice.actions;

export default messageSlice.reducer;
