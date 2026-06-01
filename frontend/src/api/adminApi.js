import API from "./axiosInstance";

export const getUsers = async (params) => {
    const response = await API.get("/api/admin/users", { params });
    return response.data;
};

export const getUserDetails = async (userId) => {
    const response = await API.get(`/api/admin/users/${userId}`);
    return response.data;
};

export const suspendUser = async (userId, reason) => {
    const response = await API.patch(`/api/admin/users/${userId}/suspend`, { reason });
    return response.data;
};

export const unsuspendUser = async (userId) => {
    const response = await API.patch(`/api/admin/users/${userId}/unsuspend`);
    return response.data;
};

export const getGigs = async (params) => {
    const response = await API.get("/api/admin/gigs", { params });
    return response.data;
};

export const getGigDetails = async (gigId) => {
    const response = await API.get(`/api/admin/gigs/${gigId}`);
    return response.data;
};

export const disableGig = async (gigId, reason) => {
    const response = await API.patch(`/api/admin/gigs/${gigId}/disable`, { reason });
    return response.data;
};

export const enableGig = async (gigId) => {
    const response = await API.patch(`/api/admin/gigs/${gigId}/enable`);
    return response.data;
};

export const getProjects = async (params) => {
    const response = await API.get("/api/admin/projects", { params });
    return response.data;
};

export const getProjectDetails = async (projectId) => {
    const response = await API.get(`/api/admin/projects/${projectId}`);
    return response.data;
};

export const getReviews = async (params) => {
    const response = await API.get("/api/admin/reviews", { params });
    return response.data;
};

export const getReviewDetails = async (reviewId) => {
    const response = await API.get(`/api/admin/reviews/${reviewId}`);
    return response.data;
};

export const hideReview = async (reviewId) => {
    const response = await API.patch(`/api/admin/reviews/${reviewId}/hide`);
    return response.data;
};

export const restoreReview = async (reviewId) => {
    const response = await API.patch(`/api/admin/reviews/${reviewId}/restore`);
    return response.data;
};

export const getDeliverables = async (params) => {
    const response = await API.get("/api/admin/deliverables", { params });
    return response.data;
};

export const getDeliverableDetails = async (deliverableId) => {
    const response = await API.get(`/api/admin/deliverables/${deliverableId}`);
    return response.data;
};

export const getAnalytics = async () => {
    const response = await API.get("/api/admin/analytics");
    return response.data;
};
