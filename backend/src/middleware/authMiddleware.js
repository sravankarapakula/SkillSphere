const jwt = require("jsonwebtoken");
const User = require("../models/user.models");

const protect = async (req, res, next) => {

    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {

        token = req.headers.authorization.split(" ")[1];

        try {

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            if (decoded.type && decoded.type !== "access") {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token"
                });
            }

            req.user = await User.findById(decoded.id)
                .select("-password");

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "User no longer exists"
                });
            }

            next();

        } catch (error) {

            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token provided"
        });
    }
};

module.exports = protect;
