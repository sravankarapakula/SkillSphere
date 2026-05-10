const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const app = express();
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorMiddleware");

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api/auth", authRoutes);
app.use(errorHandler);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SkillSphere API Running"
    });
});

module.exports = app;