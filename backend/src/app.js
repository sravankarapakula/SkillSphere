const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const app = express();
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const errorHandler = require("./middleware/errorMiddleware");

// CORS configuration — restrict origins in production
const corsOptions = {
    origin: process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "https://skillsphere.vercel.app"
        : "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// Only use morgan in development
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

// Health check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SkillSphere API Running",
        environment: process.env.NODE_ENV || "development"
    });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;