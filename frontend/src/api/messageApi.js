import API from "./axiosInstance";

export const createConversation = async (proposalId) => {
    const response = await API.post("/api/conversations/create", { proposalId });
    return response.data;
};

export const getConversations = async () => {
    const response = await API.get("/api/conversations");
    return response.data;
};

export const getMessages = async (conversationId, page = 1) => {
    const response = await API.get(`/api/messages/${conversationId}?page=${page}`);
    return response.data;
};

export const sendMessage = async (conversationId, text, attachments = []) => {
    const response = await API.post("/api/messages/send", { conversationId, text, attachments });
    return response.data;
};

export const markMessageRead = async (messageId) => {
    const response = await API.put(`/api/messages/read/${messageId}`);
    return response.data;
};
