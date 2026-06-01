const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Conversation = require("../models/Conversation");
const Proposal = require("../models/Proposal.models");
const Gig = require("../models/Gig.models");
const User = require("../models/user.models");
const Message = require("../models/Message");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function runTest() {
    let testClient, testFreelancer, testGig, testGigB, proposalA, proposalB, convA, convB;
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        // 1. Create a test Client and a test Freelancer
        console.log("\n--- Creating Test Users ---");
        testClient = await User.create({
            name: "Test Client Unique",
            email: `client.${Date.now()}@example.com`,
            password: "password123",
            role: "client"
        });
        console.log(`Created Client: ${testClient._id}`);

        testFreelancer = await User.create({
            name: "Test Freelancer Unique",
            email: `freelancer.${Date.now()}@example.com`,
            password: "password123",
            role: "freelancer"
        });
        console.log(`Created Freelancer: ${testFreelancer._id}`);

        // 2. Create a test Gig owned by Client
        console.log("\n--- Creating Test Gig A ---");
        testGig = await Gig.create({
            title: "Test Gig Unique Chats",
            description: "A test gig for verification",
            client: testClient._id,
            budgetMin: 100,
            budgetMax: 500,
            experienceLevel: "intermediate",
            status: "open"
        });
        console.log(`Created Gig A: ${testGig._id}`);

        // 3. Create two different Proposals (A and B) between same users on same/different gigs
        console.log("\n--- Creating Proposals (Same Client & Freelancer) ---");
        proposalA = await Proposal.create({
            gig: testGig._id,
            freelancer: testFreelancer._id,
            coverLetter: "Proposal A Cover Letter",
            bidAmount: 200,
            estimatedDays: 5,
            status: "submitted"
        });
        console.log(`Created Proposal A: ${proposalA._id}`);

        console.log("\n--- Creating Test Gig B ---");
        testGigB = await Gig.create({
            title: "Test Gig B Unique Chats",
            description: "Another test gig for verification",
            client: testClient._id,
            budgetMin: 200,
            budgetMax: 600,
            experienceLevel: "intermediate",
            status: "open"
        });
        console.log(`Created Gig B: ${testGigB._id}`);

        proposalB = await Proposal.create({
            gig: testGigB._id,
            freelancer: testFreelancer._id,
            coverLetter: "Proposal B Cover Letter",
            bidAmount: 300,
            estimatedDays: 7,
            status: "submitted"
        });
        console.log(`Created Proposal B: ${proposalB._id}`);

        // 4. Create chat A for Proposal A
        console.log("\n--- Creating Conversation A (Proposal A) ---");
        convA = await Conversation.create({
            participants: [testClient._id, testFreelancer._id],
            proposalId: proposalA._id,
            clientId: testClient._id,
            freelancerId: testFreelancer._id,
            gigId: testGig._id,
            gigTitle: testGig.title,
            conversationType: "proposal",
            unreadCounts: new Map([
                [testClient._id.toString(), 0],
                [testFreelancer._id.toString(), 0]
            ])
        });
        console.log(`Created Chat A: ${convA._id} (proposalId: ${convA.proposalId})`);

        // 5. Try to create duplicate chat for Proposal A (should fail unique index check)
        console.log("\n--- Verifying Unique Index on proposalId (Should Fail Duplicate) ---");
        try {
            await Conversation.create({
                participants: [testClient._id, testFreelancer._id],
                proposalId: proposalA._id,
                clientId: testClient._id,
                freelancerId: testFreelancer._id,
                gigId: testGig._id,
                gigTitle: testGig.title,
                conversationType: "proposal",
                unreadCounts: new Map([
                    [testClient._id.toString(), 0],
                    [testFreelancer._id.toString(), 0]
                ])
            });
            console.error("❌ FAILED: Duplicate conversation was created for Proposal A!");
        } catch (error) {
            console.log(`✓ SUCCESS: Blocked duplicate chat creation (Error: ${error.message})`);
        }

        // 6. Create chat B for Proposal B (should succeed since proposalId is different)
        console.log("\n--- Creating Conversation B (Proposal B, Same Users) ---");
        convB = await Conversation.create({
            participants: [testClient._id, testFreelancer._id],
            proposalId: proposalB._id,
            clientId: testClient._id,
            freelancerId: testFreelancer._id,
            gigId: testGigB._id,
            gigTitle: testGigB.title,
            conversationType: "proposal",
            unreadCounts: new Map([
                [testClient._id.toString(), 0],
                [testFreelancer._id.toString(), 0]
            ])
        });
        console.log(`Created Chat B: ${convB._id} (proposalId: ${convB.proposalId})`);

        // 7. Verify uniqueness & separation
        console.log("\n--- Checking Uniqueness & Isolation ---");
        console.log(`- Chat A distinct from Chat B: ${convA._id.toString() !== convB._id.toString()}`);
        console.log(`- Chat A has correct proposalId: ${convA.proposalId.toString() === proposalA._id.toString()}`);
        console.log(`- Chat B has correct proposalId: ${convB.proposalId.toString() === proposalB._id.toString()}`);

        // 8. Verify message isolation (sending message to Chat A does not appear in Chat B)
        console.log("\n--- Simulating Messages & Checking Isolation ---");
        const msgA = await Message.create({
            conversationId: convA._id,
            sender: testClient._id,
            text: "Hello in Proposal Chat A"
        });
        console.log(`Sent message to Chat A: "${msgA.text}"`);

        const messagesA = await Message.find({ conversationId: convA._id });
        const messagesB = await Message.find({ conversationId: convB._id });

        console.log(`- Messages in Chat A count: ${messagesA.length} (Expected: 1)`);
        console.log(`- Messages in Chat B count: ${messagesB.length} (Expected: 0)`);
        console.log(`- Message history isolated: ${messagesB.length === 0 && messagesA.length === 1}`);

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        // Clean up test data
        console.log("\n--- Cleaning up Test Data ---");
        if (convA) {
            await Message.deleteMany({ conversationId: convA._id });
            await Conversation.deleteOne({ _id: convA._id });
        }
        if (convB) {
            await Message.deleteMany({ conversationId: convB._id });
            await Conversation.deleteOne({ _id: convB._id });
        }
        if (proposalA) await Proposal.deleteOne({ _id: proposalA._id });
        if (proposalB) await Proposal.deleteOne({ _id: proposalB._id });
        if (testGig) await Gig.deleteOne({ _id: testGig._id });
        if (testGigB) await Gig.deleteOne({ _id: testGigB._id });
        if (testClient) await User.deleteOne({ _id: testClient._id });
        if (testFreelancer) await User.deleteOne({ _id: testFreelancer._id });
        console.log("Cleanup finished.");

        await mongoose.disconnect();
        console.log("Database disconnected.");
    }
}

runTest();
