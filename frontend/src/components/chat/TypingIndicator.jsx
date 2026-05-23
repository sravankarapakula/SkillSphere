import React from "react";

export default function TypingIndicator({ userName }) {
    return (
        <div className="flex items-center gap-2 mb-4 animate-message-in">
            <div className="px-4 py-2 bg-surface-100 border border-surface-200 rounded-2xl rounded-bl-md shadow-sm flex items-center gap-2">
                <span className="text-xs text-surface-500 font-medium">
                    {userName ? `${userName} is typing` : "Typing"}
                </span>
                <div className="flex gap-1 items-center h-2">
                    <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-typing-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-typing-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-typing-bounce" style={{ animationDelay: "300ms" }} />
                </div>
            </div>
        </div>
    );
}
