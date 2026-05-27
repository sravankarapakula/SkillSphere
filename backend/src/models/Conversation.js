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
        proposalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Proposal",
            required: true
        },
        gigId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gig",
            default: null
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null
        },
        gigTitle: {
            type: String,
            default: ""
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
        },
        lastReadMessage: {
            type: Map,
            of: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Message"
            },
            default: {}
        },
        lastVisibleMessage: {
            type: Map,
            of: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Message"
            },
            default: {}
        },
        unreadAnchorMessage: {
            type: Map,
            of: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Message"
            },
            default: {}
        },
        lastSeenTimestamp: {
            type: Map,
            of: Date,
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
conversationSchema.index({ proposalId: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
