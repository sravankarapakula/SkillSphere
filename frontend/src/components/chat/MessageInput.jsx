import React, { useState, useRef, useEffect } from "react";
import { getSocket } from "../../services/socketService";

export default function MessageInput({ conversationId, recipientId, onSendMessage, disabled }) {
    const [text, setText] = useState("");
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [text]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
            return;
        }

        const socket = getSocket();
        if (!socket || !conversationId || !recipientId) return;

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            socket.emit("typing", { conversationId, recipientId });
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop-typing", { conversationId, recipientId });
            isTypingRef.current = false;
        }, 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim() || disabled) return;

        onSendMessage(text.trim());
        setText("");

        const socket = getSocket();
        if (socket && conversationId && recipientId) {
            socket.emit("stop-typing", { conversationId, recipientId });
            isTypingRef.current = false;
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }

        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3 bg-white border-t border-surface-200">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={disabled ? "Select a conversation to start chatting..." : "Type a message..."}
                disabled={disabled}
                rows={1}
                className="form-input resize-none max-h-[120px] py-2.5 focus:ring-1 focus:ring-primary-500 min-h-[42px]"
            />
            <button
                type="submit"
                disabled={!text.trim() || disabled}
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl p-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer min-w-[42px] min-h-[42px]"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
            </button>
        </form>
    );
}
