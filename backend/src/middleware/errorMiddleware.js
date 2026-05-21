const errorHandler = (err, req, res, next) => {

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Mongoose bad ObjectId
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid resource ID";
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate value for field: ${field}`;
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ");
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired";
    }

    // Multer errors
    if (err.name === "MulterError") {
        statusCode = 400;
        if (err.code === "LIMIT_FILE_SIZE") {
            message = "File size exceeds the allowed limit";
        } else {
            message = err.message;
        }
    }

    // Log error in development
    if (process.env.NODE_ENV !== "production") {
        console.error("Error:", err);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
    });
};

module.exports = errorHandler;