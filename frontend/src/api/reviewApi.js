import API from "./axiosInstance";

export const createReview = async (reviewData) => {
    const response = await API.post("/api/reviews", reviewData);
    return response.data;
};

export const getProjectReviews = async (projectId) => {
    const response = await API.get(`/api/reviews/project/${projectId}`);
    return response.data;
};

export const getUserReviews = async (userId) => {
    const response = await API.get(`/api/reviews/user/${userId}`);
    return response.data;
};

export const getReviewStatus = async (projectId) => {
    const response = await API.get(`/api/reviews/status/${projectId}`);
    return response.data;
};
