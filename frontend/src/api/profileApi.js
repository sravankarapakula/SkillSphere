import API from "./axiosInstance";

// Get current user's profile
export const getMyProfile = async () => {
    const response = await API.get("/api/profile/me");
    return response.data;
};

// Get profile by user ID
export const getProfileByUserId = async (userId) => {
    const response = await API.get(`/api/profile/user/${userId}`);
    return response.data;
};

// Create or update profile
export const updateProfile = async (profileData) => {
    const response = await API.put("/api/profile", profileData);
    return response.data;
};

// Upload profile image
export const uploadProfileImage = async (formData) => {
    const response = await API.post("/api/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

// Upload resume
export const uploadResume = async (formData) => {
    const response = await API.post("/api/profile/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

// Add portfolio item
export const addPortfolioItem = async (formData) => {
    const response = await API.post("/api/profile/portfolio", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

// Remove portfolio item
export const removePortfolioItem = async (itemId) => {
    const response = await API.delete(`/api/profile/portfolio/${itemId}`);
    return response.data;
};
