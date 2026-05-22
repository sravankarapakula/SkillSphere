const { validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        const formattedErrors = errors.array().map((err) => ({
            field: err.path,
            message: err.msg,
            value: err.value
        }));

        // ===== TERMINAL LOG =====

        console.error("\n====== VALIDATION ERROR ======");

        console.error("Time:", new Date().toISOString());

        console.error("Route:", req.method, req.originalUrl);

        console.error("Body:", {
            ...req.body,
            password: req.body.password ? "[HIDDEN]" : undefined,
            secretCode: req.body.secretCode ? "[HIDDEN]" : undefined
        });

        console.error("Errors:", formattedErrors);

        console.error("==============================\n");

        // ===== CLIENT RESPONSE =====

        return res.status(400).json({
            success: false,
            message: formattedErrors[0].message,

            ...(process.env.NODE_ENV !== "production" && {
                details: formattedErrors
            })
        });
    }

    next();
};

module.exports = validateRequest;