import { memo } from "react";

function MessageBubble({ message, isOwn }) {
    const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    const isRead = (message.readBy && message.readBy.length > 1) || (message.seenBy && message.seenBy.length > 1);
    const attachments = message.attachments || [];

    return (
        <div
            className={`flex flex-col mb-4 ${
                isOwn ? "items-end" : "items-start"
            } animate-message-in`}
        >
            <div className="flex items-end gap-2 max-w-[75%]">
                {isOwn && (
                    <span className="text-[10px] text-surface-400 select-none pb-1 font-medium">
                        {formattedTime}
                    </span>
                )}
                
                <div
                    className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isOwn
                            ? "bg-white text-surface-800 rounded-2xl rounded-br-md border border-surface-200 font-normal"
                            : "bg-primary-600 text-white rounded-2xl rounded-bl-md font-normal"
                    }`}
                >
                    {message.text && (
                        <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    )}
                    {attachments.length > 0 && (
                        <div className={message.text ? "mt-2 space-y-1" : "space-y-1"}>
                            {attachments.map((attachment) => (
                                <a
                                    key={attachment.url}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`block rounded-lg px-3 py-2 text-xs font-semibold underline-offset-2 hover:underline ${
                                        isOwn ? "bg-surface-50 text-primary-700" : "bg-white/10 text-white"
                                    }`}
                                >
                                    {attachment.filename || "Attachment"}
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {!isOwn && (
                    <span className="text-[10px] text-surface-400 select-none pb-1 font-medium">
                        {formattedTime}
                    </span>
                )}
            </div>

            {isOwn && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-surface-400 mr-1 select-none">
                    {isRead ? (
                        <div className="flex items-center gap-0.5 text-primary-500 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Read</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-0.5 text-surface-400 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Sent</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default memo(MessageBubble);
