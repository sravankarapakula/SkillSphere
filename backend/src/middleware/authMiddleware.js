const jwt = require("jsonwebtoken");
const User = require("../models/User.models");

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

            req.user = await User.findById(decoded.id)
                .select("-password");

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