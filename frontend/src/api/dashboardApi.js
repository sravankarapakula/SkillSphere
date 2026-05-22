import API from "./axiosInstance";

export const getClientDashboard = async () => {
    const response = await API.get("/api/dashboard/client");
    return response.data;
};

export const getFreelancerDashboard = async () => {
    const response = await API.get("/api/dashboard/freelancer");
    return response.data;
};

export const getAdminDashboard = async () => {
    const response = await API.get("/api/dashboard/admin");
    return response.data;
};
