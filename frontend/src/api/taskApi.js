import API from "./axiosInstance";

export const getUpcomingTasks = async (params = {}) => {
    const response = await API.get("/api/tasks/upcoming", { params });
    return response.data;
};
