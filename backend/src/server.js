const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");
const path = require("path");

dotenv.config({
    path: path.resolve(__dirname, "../.env")
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
.catch((err) => {
    console.log(err);
});