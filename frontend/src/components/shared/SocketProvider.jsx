import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { connectSocket, disconnectSocket } from "../../services/socketService";
import {
    applyChatUpdate,
    applyMessagesRead,
    applyNotificationsUpdate,
    applyUnreadCountUpdate,
    receiveSocketMessage,
    setSocketConnected,
    setOnlineUsers,
    addUserOnline,
    removeUserOffline,
    setTyping
} from "../../redux/slices/messageSlice";

export default function SocketProvider({ children }) {
    const { token, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!token || !user) {
            disconnectSocket();
            dispatch(setSocketConnected(false));
            return undefined;
        }

        const socket = connectSocket(token);
        const currentUserId = user._id;

        const handleConnect = () => {
            dispatch(setSocketConnected(true));
            socket.emit("register-user", currentUserId);
        };

        const handleDisconnect = () => {
            dispatch(setSocketConnected(false));
        };

        const handleOnlineUsers = (userIds) => {
            dispatch(setOnlineUsers(userIds));
        };

        const handleNewMessage = (payload) => {
            const message = payload.message || payload;
            dispatch(receiveSocketMessage({
                ...payload,
                message,
                currentUserId,
                isSender: String(message.sender?._id || message.sender) === String(currentUserId)
            }));
        };

        const handleMessageSent = (message) => {
            dispatch(receiveSocketMessage({
                message,
                currentUserId,
                isSender: true,
                lastMessageText: message.text,
                updatedAt: message.createdAt
            }));
        };

        const handleUnreadCount = (payload) => {
            dispatch(applyUnreadCountUpdate({
                ...payload,
                currentUserId
            }));
        };

        const handleMessagesRead = (payload) => {
            dispatch(applyMessagesRead({
                ...payload,
                currentUserId
            }));
        };

        const handleChatUpdated = (payload) => {
            dispatch(applyChatUpdate({
                ...payload,
                currentUserId
            }));
        };

        const handleNotificationsUpdated = (payload) => {
            dispatch(applyNotificationsUpdate(payload));
        };

        const handleTypingStatus = (payload) => {
            dispatch(setTyping(payload));
        };

        const handleUserOnline = ({ userId }) => {
            dispatch(addUserOnline(userId));
        };

        const handleUserOffline = ({ userId }) => {
            dispatch(removeUserOffline(userId));
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("online-users", handleOnlineUsers);
        socket.on("new_message", handleNewMessage);
        socket.on("receive-message", handleNewMessage);
        socket.on("message-sent", handleMessageSent);
        socket.on("unread_count_updated", handleUnreadCount);
        socket.on("messages_read", handleMessagesRead);
        socket.on("messages-read", handleMessagesRead);
        socket.on("chat_updated", handleChatUpdated);
        socket.on("conversation-updated", handleChatUpdated);
        socket.on("notifications_updated", handleNotificationsUpdated);
        socket.on("typing_status", handleTypingStatus);
        socket.on("typing", (payload) => handleTypingStatus({ ...payload, isTyping: true }));
        socket.on("stop-typing", (payload) => handleTypingStatus({ ...payload, isTyping: false }));
        socket.on("user_online_status", ({ userId, isOnline }) => {
            if (isOnline) {
                dispatch(addUserOnline(userId));
            } else {
                dispatch(removeUserOffline(userId));
            }
        });
        socket.on("user-online", handleUserOnline);
        socket.on("user-offline", handleUserOffline);

        if (socket.connected) {
            handleConnect();
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("online-users", handleOnlineUsers);
            socket.off("new_message", handleNewMessage);
            socket.off("receive-message", handleNewMessage);
            socket.off("message-sent", handleMessageSent);
            socket.off("unread_count_updated", handleUnreadCount);
            socket.off("messages_read", handleMessagesRead);
            socket.off("messages-read", handleMessagesRead);
            socket.off("chat_updated", handleChatUpdated);
            socket.off("conversation-updated", handleChatUpdated);
            socket.off("notifications_updated", handleNotificationsUpdated);
            socket.off("typing_status", handleTypingStatus);
            socket.off("typing");
            socket.off("stop-typing");
            socket.off("user_online_status");
            socket.off("user-online", handleUserOnline);
            socket.off("user-offline", handleUserOffline);
            disconnectSocket();
            dispatch(setSocketConnected(false));
        };
    }, [token, user, dispatch]);

    return <>{children}</>;
}
