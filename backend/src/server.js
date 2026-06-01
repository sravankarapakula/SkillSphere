const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");
const path = require("path");
const initializeSocket = require("./socket/socketServer");

dotenv.config({
    path: path.resolve(__dirname, "../.env")
});

const PORT = process.env.PORT || 5000;

// Create HTTP server and attach Socket.IO
const httpServer = http.createServer(app);
const io = initializeSocket(httpServer);
app.set("io", io);

const migrateExistingReviews = require("./utils/migrateReviews");

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
    console.log("MongoDB Connected");
    await migrateExistingReviews();

    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
.catch((err) => {
    console.log(err);
});
