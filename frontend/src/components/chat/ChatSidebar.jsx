import { useDispatch } from "react-redux";
import { setActiveConversation } from "../../redux/slices/messageSlice";

export default function ChatSidebar({ conversations, isLoading, currentUser, onlineUsers, activeId, onSelectMobileToggle }) {
    const dispatch = useDispatch();

    const formatTimestamp = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }
        
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    if (isLoading) {
        return (
            <div className="w-full flex-1 flex flex-col divide-y divide-surface-200 overflow-y-auto">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 flex gap-3 animate-pulse">
                        <div className="w-12 h-12 bg-surface-200 rounded-full flex-shrink-0" />
                        <div className="flex-1 flex flex-col gap-2 min-w-0">
                            <div className="flex justify-between items-center">
                                <div className="h-4 bg-surface-200 rounded w-24" />
                                <div className="h-3 bg-surface-200 rounded w-10" />
                            </div>
                            <div className="h-3 bg-surface-200 rounded w-4/5" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!conversations || conversations.length === 0) {
        return (
            <div className="w-full flex-1 flex flex-col items-center justify-center p-8 text-center bg-white h-full">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-4 shadow-sm animate-fade-in">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                </div>
                <h3 className="text-base font-semibold text-surface-800 mb-1">No chats yet</h3>
                <p className="text-xs text-surface-500 max-w-[200px] leading-relaxed">
                    Conversations appear here once a client initiates a discussion on a proposal.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full flex-1 overflow-y-auto divide-y divide-surface-100 bg-white">
            {conversations.map((conv) => {
                const otherParticipant = conv.participants.find(
                    (participant) => String(participant._id) !== String(currentUser?._id)
                );
                const isActive = conv._id === activeId;
                const isOnline = onlineUsers.some((id) => String(id) === String(otherParticipant?._id));
                const unreadCount = conv.unreadCounts
                    ? (typeof conv.unreadCounts.get === "function"
                        ? conv.unreadCounts.get(String(currentUser?._id))
                        : conv.unreadCounts[String(currentUser?._id)]) || 0
                    : 0;

                const handleSelect = () => {
                    dispatch(setActiveConversation(conv._id));
                    if (onSelectMobileToggle) {
                        onSelectMobileToggle();
                    }
                };

                return (
                    <button
                        key={conv._id}
                        onClick={handleSelect}
                        className={`w-full p-4 flex gap-3 text-left transition-all duration-200 cursor-pointer items-center border-l-4 ${
                            isActive
                                ? "bg-primary-50/70 border-primary-600"
                                : "hover:bg-surface-50/80 border-transparent"
                        }`}
                    >
                        <div className="relative flex-shrink-0">
                            {(otherParticipant?.profileImage || otherParticipant?.profilePicture) ? (
                                <img
                                    src={otherParticipant.profileImage || otherParticipant.profilePicture}
                                    alt={otherParticipant.name}
                                    className="w-11 h-11 rounded-full object-cover border border-surface-200"
                                />
                            ) : (
                                <div className="w-11 h-11 bg-primary-100 text-primary-700 font-bold rounded-full flex items-center justify-center text-sm border border-primary-200">
                                    {otherParticipant?.name?.charAt(0).toUpperCase() || "?"}
                                </div>
                            )}
                            {isOnline && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="text-sm font-semibold text-surface-800 truncate">
                                    {otherParticipant?.name || "Deleted User"}
                                </h4>
                                <span className="text-[10px] text-surface-400 font-medium">
                                    {formatTimestamp(conv.updatedAt)}
                                </span>
                            </div>

                            {conv.gigTitle && (
                                <p className="text-xs text-primary-600 font-medium truncate mb-1" title={conv.gigTitle}>
                                    {conv.gigTitle}
                                </p>
                            )}

                            <div className="flex items-center justify-between gap-2">
                                <p
                                    className={`text-xs truncate flex-1 ${
                                        unreadCount > 0
                                            ? "text-surface-900 font-semibold"
                                            : "text-surface-500"
                                    }`}
                                >
                                    {conv.lastMessageText || "No messages yet"}
                                </p>

                                {unreadCount > 0 && (
                                    <span className="flex-shrink-0 bg-danger text-white text-[10px] font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
