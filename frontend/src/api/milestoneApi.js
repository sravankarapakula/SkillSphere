import API from "./axiosInstance";

export const createMilestone = async (data) => {
    const response = await API.post("/api/milestones", data);
    return response.data;
};

export const getProjectMilestones = async (projectId) => {
    const response = await API.get(`/api/milestones/project/${projectId}`);
    return response.data;
};

export const updateMilestone = async (id, data) => {
    const response = await API.put(`/api/milestones/${id}`, data);
    return response.data;
};

export const deleteMilestone = async (id) => {
    const response = await API.delete(`/api/milestones/${id}`);
    return response.data;
};

export const updateMilestoneStatus = async (id, status) => {
    const response = await API.patch(`/api/milestones/${id}/status`, { status });
    return response.data;
};
