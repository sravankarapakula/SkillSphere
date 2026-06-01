const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Conversation = require("../models/Conversation");
const Proposal = require("../models/Proposal.models");
const Gig = require("../models/Gig.models");
const { enrichConversation } = require("../services/chatReadService");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function runVerification() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        // 1. Schema check: verify fields on a test/migrated document
        console.log("\n--- Checking Conversation Schema ---");
        const oneConv = await Conversation.findOne({ proposalId: { $ne: null } });
        if (oneConv) {
            console.log("Found migrated conversation:");
            console.log(`- _id: ${oneConv._id}`);
            console.log(`- proposalId: ${oneConv.proposalId}`);
            console.log(`- clientId: ${oneConv.clientId}`);
            console.log(`- freelancerId: ${oneConv.freelancerId}`);
            console.log(`- gigId: ${oneConv.gigId}`);
            console.log(`- gigTitle: "${oneConv.gigTitle}"`);
            console.log(`- projectId: ${oneConv.projectId}`);
            console.log(`- conversationType: ${oneConv.conversationType}`);
        } else {
            console.log("No migrated conversations found yet.");
        }

        // 2. Query check: verify we can query by proposalId
        console.log("\n--- Checking Proposal ID Querying ---");
        if (oneConv) {
            const queried = await Conversation.findOne({ proposalId: oneConv.proposalId });
            console.log(`Query by proposalId succeeded: ${queried && queried._id.toString() === oneConv._id.toString()}`);
        }

        // 3. Enrichment check: verify helper returns all required keys
        console.log("\n--- Checking enrichConversation Helper ---");
        if (oneConv) {
            const enriched = enrichConversation(oneConv, oneConv.participants[0]);
            const expectedKeys = ["participant", "gigId", "proposalId", "gigTitle", "unreadCount", "lastMessage"];
            let allKeysPresent = true;
            for (const key of expectedKeys) {
                const present = enriched[key] !== undefined;
                console.log(`- Key "${key}" present: ${present}`);
                if (!present) allKeysPresent = false;
            }
            console.log(`Enrichment verification passed: ${allKeysPresent}`);
        }

        // 4. Duplicate checks: verify uniqueness index on proposalId
        console.log("\n--- Checking Unique Index ---");
        const indexes = await Conversation.collection.indexes();
        const proposalIdIndex = indexes.find(idx => idx.key && idx.key.proposalId === 1);
        console.log(`Unique index on proposalId exists: ${Boolean(proposalIdIndex && proposalIdIndex.unique)}`);

        console.log("\nVerification successfully completed!");
    } catch (error) {
        console.error("Verification failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Database disconnected.");
    }
}

runVerification();
