const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Conversation = require("../models/Conversation");
const Proposal = require("../models/Proposal.models");
const Gig = require("../models/Gig.models");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function runMigration() {
    try {
        console.log("Connecting to Database...");
        if (!process.env.MONGO_URI) {
            console.error("Error: MONGO_URI is not defined in .env file.");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected successfully.");

        // Fetch all conversations
        const conversations = await Conversation.find({});
        console.log(`Found ${conversations.length} total conversations to analyze.`);

        let migratedCount = 0;
        for (const conv of conversations) {
            // Determine the proposal ID to use (could be stored on legacy 'proposal' field or 'proposalId')
            // Using conv.get('proposal') directly avoids Mongoose Schema type issues if proposal field was deleted from model
            const rawProposalId = conv.proposalId || conv.get("proposal");

            if (!rawProposalId) {
                console.log(`Conversation ${conv._id} has no proposal reference. Skipping.`);
                continue;
            }

            const proposal = await Proposal.findById(rawProposalId).populate("gig");
            if (!proposal) {
                console.log(`Proposal ${rawProposalId} not found for conversation ${conv._id}. Skipping.`);
                continue;
            }

            // Set canonical proposalId field
            conv.proposalId = proposal._id;

            // Backfill gigId and gigTitle (snapshot)
            if (proposal.gig) {
                conv.gigId = proposal.gig._id;
                conv.gigTitle = proposal.gig.title || "";
            }

            // Determine if there is a linked project
            if (proposal.project) {
                conv.projectId = proposal.project;
                conv.conversationType = "project";
            } else {
                conv.projectId = null;
                conv.conversationType = "proposal";
            }

            // Unset the legacy 'proposal' field
            conv.set("proposal", undefined);

            await conv.save();
            migratedCount++;
            console.log(`Successfully migrated conversation ${conv._id} for gig "${conv.gigTitle}" (${conv.conversationType})`);
        }

        console.log(`Migration completed. Successfully processed/migrated ${migratedCount} conversations.`);
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Database disconnected.");
    }
}

runMigration();
