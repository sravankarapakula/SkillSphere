const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],
        proposal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Proposal",
            required: true
        },
        conversationType: {
            type: String,
            enum: ["proposal", "project"],
            default: "proposal"
        },
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },
        lastMessageText: {
            type: String,
            default: ""
        },
        unreadCounts: {
            type: Map,
            of: Number,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

// Index for fast lookup of a user's conversations
conversationSchema.index({ participants: 1 });

// Prevent duplicate conversations for the same proposal
conversationSchema.index({ proposal: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
