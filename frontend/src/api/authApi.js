import API from "./axiosInstance";

// Register a new user
export const registerUser = async (userData) => {
    const response = await API.post("/api/auth/register", userData);
    return response.data;
};

// Login an existing user
export const loginUser = async (credentials) => {
    const response = await API.post("/api/auth/login", credentials);
    return response.data;
};

// Get current authenticated user from JWT
export const getMe = async () => {
    const response = await API.get("/api/auth/me");
    return response.data;
};
