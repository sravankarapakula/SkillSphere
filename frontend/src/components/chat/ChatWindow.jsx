import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMessages, markMessagesReadOptimistic } from "../../redux/slices/messageSlice";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import LoadingSpinner from "../shared/LoadingSpinner";
import { getSocket } from "../../services/socketService";

const isReadBy = (message, userId) => (
    message?.readBy || []
).some((id) => String(id?._id || id) === String(userId));

const getSenderId = (message) => String(message?.sender?._id || message?.sender || "");

function UnreadDivider({ count }) {
    return (
        <div className="my-4 flex items-center gap-3 animate-fade-in">
            <div className="h-px flex-1 bg-danger/30" />
            <span className="rounded-full bg-danger/10 px-3 py-1 text-[11px] font-bold text-danger shadow-sm">
                {count} unread {count === 1 ? "message" : "messages"}
            </span>
            <div className="h-px flex-1 bg-danger/30" />
        </div>
    );
}

export default function ChatWindow({ conversation, currentUser, onlineUsers, onBack }) {
    const dispatch = useDispatch();
    const conversationId = conversation?._id;
    const currentUserId = currentUser?._id;

    const {
        messages: allMessages,
        unreadDividerMessageId,
        isLoadingMessages,
        hasMore: allHasMore,
        currentPage: allCurrentPage,
        typingUsers
    } = useSelector((state) => state.message);

    const messages = useMemo(() => allMessages[conversationId] || [], [allMessages, conversationId]);
    const hasMore = allHasMore[conversationId] || false;
    const currentPage = allCurrentPage[conversationId] || 1;
    const typingList = typingUsers[conversationId] || [];
    const dividerMessageId = unreadDividerMessageId[conversationId];

    const containerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messageNodesRef = useRef(new Map());
    const pendingReadIdsRef = useRef(new Set());
    const readFlushTimerRef = useRef(null);
    const wasAtBottomRef = useRef(true);
    const previousMessageCountRef = useRef(0);
    const unreadAnchorScrolledRef = useRef(null);
    const [prevScrollHeight, setPrevScrollHeight] = useState(0);
    const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);

    const otherParticipant = conversation?.participants.find(
        (participant) => String(participant._id) !== String(currentUserId)
    );
    const isOnline = onlineUsers.some((id) => String(id) === String(otherParticipant?._id));
    const unreadCount = conversation?.unreadCounts?.[String(currentUserId)] || 0;

    const incomingUnreadIds = useMemo(() => new Set(
        messages
            .filter((message) => getSenderId(message) !== String(currentUserId) && !isReadBy(message, currentUserId))
            .map((message) => String(message._id))
    ), [messages, currentUserId]);

    const scrollToBottom = useCallback((behavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
        setShowNewMessagesButton(false);
    }, []);

    const updateBottomState = useCallback(() => {
        const container = containerRef.current;
        if (!container) return true;

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        const isAtBottom = distanceFromBottom < 80;
        wasAtBottomRef.current = isAtBottom;
        if (isAtBottom) {
            setShowNewMessagesButton(false);
        }
        return isAtBottom;
    }, []);

    const flushReadIds = useCallback(() => {
        if (!conversationId || !currentUserId || pendingReadIdsRef.current.size === 0) return;

        const messageIds = Array.from(pendingReadIdsRef.current);
        const lastVisibleMessageId = messageIds[messageIds.length - 1];
        pendingReadIdsRef.current.clear();

        dispatch(markMessagesReadOptimistic({ conversationId, messageIds, currentUserId }));

        const socket = getSocket();
        if (socket) {
            socket.emit("message_visible", { conversationId, messageIds, lastVisibleMessageId });
        }
    }, [conversationId, currentUserId, dispatch]);

    const queueReadId = useCallback((messageId) => {
        pendingReadIdsRef.current.add(String(messageId));
        if (readFlushTimerRef.current) {
            clearTimeout(readFlushTimerRef.current);
        }
        readFlushTimerRef.current = setTimeout(flushReadIds, 250);
    }, [flushReadIds]);

    const registerMessageNode = useCallback((messageId, node) => {
        if (!messageId) return;

        if (node) {
            messageNodesRef.current.set(String(messageId), node);
        } else {
            messageNodesRef.current.delete(String(messageId));
        }
    }, []);

    useEffect(() => {
        if (!conversationId) return undefined;

        dispatch(fetchMessages({ conversationId, page: 1 }));
        previousMessageCountRef.current = 0;
        unreadAnchorScrolledRef.current = null;
        wasAtBottomRef.current = true;

        const socket = getSocket();
        socket?.emit("join_chat", { conversationId });
        socket?.emit("open_chat", { conversationId });

        const pendingReadIds = pendingReadIdsRef.current;
        return () => {
            socket?.emit("leave_chat", { conversationId });
            pendingReadIds.clear();
            if (readFlushTimerRef.current) {
                clearTimeout(readFlushTimerRef.current);
            }
        };
    }, [conversationId, dispatch]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !conversationId || !currentUserId || incomingUnreadIds.size === 0) return undefined;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting || entry.intersectionRatio < 0.6) return;

                const messageId = entry.target.dataset.messageId;
                if (incomingUnreadIds.has(String(messageId))) {
                    queueReadId(messageId);
                }
            });
        }, {
            root: container,
            threshold: [0.6]
        });

        incomingUnreadIds.forEach((messageId) => {
            const node = messageNodesRef.current.get(String(messageId));
            if (node) {
                observer.observe(node);
            }
        });

        return () => observer.disconnect();
    }, [conversationId, currentUserId, incomingUnreadIds, queueReadId]);

    useEffect(() => {
        if (prevScrollHeight && containerRef.current) {
            const newScrollHeight = containerRef.current.scrollHeight;
            containerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
            setPrevScrollHeight(0);
            return;
        }

        const previousCount = previousMessageCountRef.current;
        const nextCount = messages.length;
        previousMessageCountRef.current = nextCount;

        if (nextCount === 0) return;

        const latest = messages[nextCount - 1];
        const latestIsOwn = getSenderId(latest) === String(currentUserId);
        const hasUnreadAnchor = Boolean(dividerMessageId && unreadCount > 0);

        if (
            hasUnreadAnchor
            && unreadAnchorScrolledRef.current === null
            && messageNodesRef.current.has(String(dividerMessageId))
        ) {
            const node = messageNodesRef.current.get(String(dividerMessageId));
            node.scrollIntoView({ block: "start", behavior: previousCount === 0 ? "auto" : "smooth" });
            unreadAnchorScrolledRef.current = "done";
            wasAtBottomRef.current = false;
            return;
        }

        if ((previousCount === 0 && !hasUnreadAnchor) || latestIsOwn || wasAtBottomRef.current) {
            scrollToBottom(previousCount === 0 ? "auto" : "smooth");
        } else if (nextCount > previousCount) {
            setShowNewMessagesButton(true);
        }
    }, [messages, prevScrollHeight, currentUserId, scrollToBottom, dividerMessageId, unreadCount]);

    useEffect(() => {
        if (typingList.length > 0 && wasAtBottomRef.current) {
            scrollToBottom("smooth");
        }
    }, [typingList.length, scrollToBottom]);

    const handleLoadMore = () => {
        if (containerRef.current) {
            setPrevScrollHeight(containerRef.current.scrollHeight);
        }
        dispatch(fetchMessages({ conversationId, page: currentPage + 1 }));
    };

    const handleSendMessage = (text) => {
        const socket = getSocket();
        if (socket && conversationId) {
            socket.emit("send_message", { conversationId, text });
        }
    };

    if (!conversation) {
        return (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-surface-50 p-8 text-center h-full">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-surface-300 shadow-sm border border-surface-100 mb-5 animate-pulse-glow">
                    <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-surface-800 mb-2">Select a Conversation</h3>
                <p className="text-sm text-surface-500 max-w-sm leading-relaxed">
                    Choose a conversation from the sidebar or open discussion on a pending/accepted proposal to start messaging.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col bg-surface-50 h-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-surface-200">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onBack}
                        className="md:hidden p-1.5 hover:bg-surface-100 rounded-lg text-surface-600 transition cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                    </button>

                    <div className="relative flex-shrink-0">
                        {(otherParticipant?.profileImage || otherParticipant?.profilePicture) ? (
                            <img
                                src={otherParticipant.profileImage || otherParticipant.profilePicture}
                                alt={otherParticipant.name}
                                className="w-10 h-10 rounded-full object-cover border border-surface-200"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-primary-100 text-primary-700 font-bold rounded-full flex items-center justify-center text-sm border border-primary-200">
                                {otherParticipant?.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                        )}
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-white" />
                        )}
                    </div>

                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-surface-800 truncate">
                            {otherParticipant?.name || "Deleted User"}
                        </h3>
                        <p className="text-[10px] text-surface-400 font-medium">
                            {isOnline ? "Online" : "Offline"}
                        </p>
                    </div>
                </div>

                {unreadCount > 0 && (
                    <span className="rounded-full bg-danger/10 px-2.5 py-1 text-[11px] font-bold text-danger">
                        {unreadCount} unread
                    </span>
                )}
            </div>

            <div className="relative flex-1 overflow-hidden">
                <div
                    ref={containerRef}
                    onScroll={updateBottomState}
                    className="h-full overflow-y-auto px-4 py-4"
                >
                    {hasMore && (
                        <div className="flex justify-center mb-4">
                            <button
                                onClick={handleLoadMore}
                                disabled={isLoadingMessages}
                                className="px-3 py-1.5 bg-white border border-surface-200 rounded-full text-xs font-semibold text-primary-600 hover:bg-primary-50 disabled:opacity-50 transition shadow-sm cursor-pointer"
                            >
                                {isLoadingMessages ? "Loading..." : "Load Older Messages"}
                            </button>
                        </div>
                    )}

                    {isLoadingMessages && messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <LoadingSpinner size="md" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-surface-300 shadow-sm border border-surface-100 mb-3">
                                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-9 9-9s9 4.582 9 9z"></path>
                                </svg>
                            </div>
                            <h4 className="text-sm font-semibold text-surface-800 mb-1">Say hello!</h4>
                            <p className="text-xs text-surface-400 max-w-[200px]">
                                Start the conversation by sending a message below.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isOwnMessage = getSenderId(msg) === String(currentUserId);
                            return (
                                <Fragment key={msg._id}>
                                    {dividerMessageId && String(dividerMessageId) === String(msg._id) && (
                                        <UnreadDivider count={unreadCount || incomingUnreadIds.size} />
                                    )}
                                    <div
                                        ref={(node) => registerMessageNode(msg._id, node)}
                                        data-message-id={msg._id}
                                    >
                                        <MessageBubble
                                            message={msg}
                                            isOwn={isOwnMessage}
                                        />
                                    </div>
                                </Fragment>
                            );
                        })
                    )}

                    {typingList.length > 0 && (
                        <TypingIndicator userName={typingList[0].userName} />
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {showNewMessagesButton && (
                    <button
                        onClick={() => scrollToBottom("smooth")}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-primary-700"
                    >
                        New messages
                    </button>
                )}
            </div>

            <MessageInput
                conversationId={conversationId}
                recipientId={otherParticipant?._id}
                onSendMessage={handleSendMessage}
                disabled={!conversationId}
            />
        </div>
    );
}
