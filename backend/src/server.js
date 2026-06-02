const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
    path: path.resolve(__dirname, "../.env")
});

const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const initializeSocket = require("./socket/socketServer");


// console.log("CWD:", process.cwd());
// console.log("ENV RESULT:", dotenv.config());


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
