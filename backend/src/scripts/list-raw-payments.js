const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Payment = require("../models/Payment");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function listRaw() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected.");

        const payments = await Payment.find({}).lean();
        console.log("Found raw payments:", payments.length);
        console.log(JSON.stringify(payments, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

listRaw();
