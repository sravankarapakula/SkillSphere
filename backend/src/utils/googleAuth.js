const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID Token and extracts user profile info.
 * @param {string} token - The Google ID token (credential) from frontend
 * @returns {Promise<{email: string, name: string, picture: string, googleId: string}>}
 */
const verifyGoogleToken = async (token) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        
        return {
            email: payload.email,
            name: payload.name,
            picture: payload.picture || "",
            googleId: payload.sub
        };
    } catch (error) {
        console.error("Error verifying Google ID token:", error);
        throw new Error("Invalid Google token verification failed");
    }
};

module.exports = {
    verifyGoogleToken
};
