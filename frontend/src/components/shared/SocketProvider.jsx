import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { connectSocket, disconnectSocket } from "../../services/socketService";
import {
    addMessage,
    updateConversationOnNewMessage,
    markConversationRead,
    updateMessageReadBy,
    setOnlineUsers,
    addUserOnline,
    removeUserOffline,
    setTyping
} from "../../redux/slices/messageSlice";

export default function SocketProvider({ children }) {
    const { token, user } = useSelector((state) => state.auth);
    const { activeConversationId } = useSelector((state) => state.message);
    const dispatch = useDispatch();

    useEffect(() => {
        if (token && user) {
            const socket = connectSocket(token);

            const handleConnect = () => {
                console.log(`[Socket] Connected as user ${user.name} (${user._id})`);
                socket.emit("register-user", user._id);
            };

            socket.on("connect", handleConnect);

            // If already connected, register immediately
            if (socket.connected) {
                console.log(`[Socket] Already connected as user ${user.name} (${user._id})`);
                handleConnect();
            }

            // Listen for online users list
            socket.on("online-users", (userIds) => {
                console.log("[Socket] Current online users updated:", userIds);
                dispatch(setOnlineUsers(userIds));
            });

            // Listen for receive-message
            socket.on("receive-message", (message) => {
                console.log(`[Socket] Received message from ${message.sender.name}:`, message.text);
                dispatch(addMessage(message));
                dispatch(updateConversationOnNewMessage({
                    conversationId: message.conversationId,
                    lastMessageText: message.text,
                    updatedAt: new Date().toISOString(),
                    currentUserId: user._id,
                    isSender: false
                }));

                // If the message is for the active conversation, mark it read instantly
                if (activeConversationId === message.conversationId) {
                    socket.emit("mark-read", { conversationId: message.conversationId });
                    dispatch(markConversationRead({ conversationId: message.conversationId, currentUserId: user._id }));
                }
            });

            // Listen for message-sent (acknowledgment for client sending)
            socket.on("message-sent", (message) => {
                console.log("[Socket] Message sent successfully acknowledged:", message.text);
                dispatch(addMessage(message));
                dispatch(updateConversationOnNewMessage({
                    conversationId: message.conversationId,
                    lastMessageText: message.text,
                    updatedAt: new Date().toISOString(),
                    currentUserId: user._id,
                    isSender: true
                }));
            });

            // Listen for messages-read (when the other participant reads our messages)
            socket.on("messages-read", (data) => {
                dispatch(updateMessageReadBy({
                    conversationId: data.conversationId,
                    readByUserId: data.readByUserId
                }));
            });

            // Listen for typing status
            socket.on("typing", (data) => {
                dispatch(setTyping({
                    conversationId: data.conversationId,
                    userId: data.userId,
                    userName: data.userName,
                    isTyping: true
                }));
            });

            socket.on("stop-typing", (data) => {
                dispatch(setTyping({
                    conversationId: data.conversationId,
                    userId: data.userId,
                    isTyping: false
                }));
            });

            // Listen for online/offline updates
            socket.on("user-online", (data) => {
                dispatch(addUserOnline(data.userId));
            });

            socket.on("user-offline", (data) => {
                dispatch(removeUserOffline(data.userId));
            });

            return () => {
                socket.off("connect", handleConnect);
                socket.off("online-users");
                socket.off("receive-message");
                socket.off("message-sent");
                socket.off("messages-read");
                socket.off("typing");
                socket.off("stop-typing");
                socket.off("user-online");
                socket.off("user-offline");
                disconnectSocket();
            };
        } else {
            disconnectSocket();
        }
    }, [token, user, dispatch, activeConversationId]);

    return <>{children}</>;
}
