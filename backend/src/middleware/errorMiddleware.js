const errorHandler = (err, req, res, next) => {

    const isDev = process.env.NODE_ENV !== "production";

    let statusCode = err.statusCode || 500;

    let message = err.message || "Internal Server Error";

    let details = null;

    // ===== Mongoose Cast Error =====
    if (err.name === "CastError") {

        statusCode = 400;

        message = "Invalid resource ID";

        details = {
            field: err.path,
            value: err.value
        };
    }

    // ===== Duplicate Key =====
    if (err.code === 11000) {

        statusCode = 400;

        const field = Object.keys(err.keyValue)[0];

        message = `Duplicate value for ${field}`;

        details = {
            field,
            value: err.keyValue[field]
        };
    }

    // ===== Mongoose Validation =====
    if (err.name === "ValidationError") {

        statusCode = 400;

        details = Object.values(err.errors).map((val) => ({
            field: val.path,
            message: val.message,
            value: val.value
        }));

        message = details[0]?.message || "Validation failed";
    }

    // ===== JWT Errors =====
    if (err.name === "JsonWebTokenError") {

        statusCode = 401;

        message = "Invalid token";
    }

    if (err.name === "TokenExpiredError") {

        statusCode = 401;

        message = "Token expired";
    }

    // ===== Multer Errors =====
    if (err.name === "MulterError") {

        statusCode = 400;

        message =
            err.code === "LIMIT_FILE_SIZE"
                ? "File size exceeds limit"
                : err.message;
    }

    // ===== SAFE TERMINAL LOGGING =====

    console.error("\n========== ERROR ==========");

    console.error("Time:", new Date().toISOString());

    console.error("Route:", req.method, req.originalUrl);

    console.error("Message:", err.message);

    console.error("Error Name:", err.name);

    if (isDev) {

        if (details) {
            console.error("Details:", details);
        }

        console.error("Stack:\n", err.stack);
    }

    console.error("===========================\n");

    // ===== SAFE CLIENT RESPONSE =====

    res.status(statusCode).json({
        success: false,
        message,

        ...(isDev && details && {
            details
        })
    });
};

module.exports = errorHandler;