import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchConversations, setActiveConversation } from "../redux/slices/messageSlice";
import ChatSidebar from "../components/chat/ChatSidebar";
import ChatWindow from "../components/chat/ChatWindow";

export default function Messages() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const {
        conversations,
        activeConversationId,
        isLoadingConversations,
        onlineUsers
    } = useSelector((state) => state.message);

    useEffect(() => {
        dispatch(fetchConversations());
    }, [dispatch]);

    const activeConversation = conversations.find(
        (c) => c._id === activeConversationId
    );

    const handleBackToSidebar = () => {
        dispatch(setActiveConversation(null));
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            <div className="mb-4">
                <h1 className="text-xl font-bold text-surface-900 md:text-2xl">Messages</h1>
                <p className="text-xs text-surface-500 mt-1">
                    Discuss gig specifications and project details in real-time.
                </p>
            </div>

            <div className="flex bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden h-[calc(100vh-180px)] min-h-[480px]">
                {/* Conversations Sidebar */}
                <div
                    className={`w-full md:w-80 flex flex-col border-r border-surface-200 flex-shrink-0 ${
                        activeConversationId ? "hidden md:flex" : "flex"
                    }`}
                >
                    <div className="p-4 border-b border-surface-200 bg-white">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                disabled
                                className="w-full pl-9 pr-4 py-1.5 text-xs bg-surface-50 border border-surface-200 rounded-xl text-surface-400 cursor-not-allowed select-none placeholder:text-surface-400"
                            />
                        </div>
                    </div>
                    <ChatSidebar
                        conversations={conversations}
                        isLoading={isLoadingConversations}
                        currentUser={user}
                        onlineUsers={onlineUsers}
                        activeId={activeConversationId}
                    />
                </div>

                {/* Chat window */}
                <div
                    className={`flex-1 flex flex-col h-full bg-surface-50 ${
                        activeConversationId ? "flex" : "hidden md:flex"
                    }`}
                >
                    <ChatWindow
                        conversation={activeConversation}
                        currentUser={user}
                        onlineUsers={onlineUsers}
                        onBack={handleBackToSidebar}
                    />
                </div>
            </div>
        </div>
    );
}
