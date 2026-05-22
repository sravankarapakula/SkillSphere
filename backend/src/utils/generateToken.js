const jwt = require("jsonwebtoken");

const generateAccessToken = (id, role) => {
    return jwt.sign(
        { id, role, type: "access" },
        process.env.JWT_SECRET,
        {
            expiresIn: "15m"
        }
    );
};

const generateRefreshToken = (id, role) => {
    return jwt.sign(
        { id, role, type: "refresh" },
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};

const generateTokenPair = (id, role) => ({
    accessToken: generateAccessToken(id, role),
    refreshToken: generateRefreshToken(id, role)
});

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair
};
