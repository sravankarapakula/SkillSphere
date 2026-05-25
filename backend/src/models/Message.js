const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            default: "",
            trim: true,
            maxlength: 5000
        },
        attachments: [
            {
                url: { type: String },
                filename: { type: String },
                mimetype: { type: String }
            }
        ],
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        seenBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        isRead: {
            type: Boolean,
            default: false
        },
        readAt: {
            type: Date,
            default: null
        },
        visibilityTracked: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

messageSchema.path("text").validate(function validateMessageContent() {
    const hasText = typeof this.text === "string" && this.text.trim().length > 0;
    const hasAttachment = Array.isArray(this.attachments)
        && this.attachments.some(
            (attachment) => attachment && typeof attachment.url === "string" && attachment.url.trim().length > 0
        );

    return hasText || hasAttachment;
}, "Message text or attachment is required");

// Compound index for paginated message queries within a conversation
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, sender: 1, readBy: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
