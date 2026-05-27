import API from "./axiosInstance";

export const getUserProjects = async () => {
    const response = await API.get("/api/projects");
    return response.data;
};

export const getProjectById = async (projectId) => {
    const response = await API.get(`/api/projects/${projectId}`);
    return response.data;
};

export const updateProject = async (projectId, updateData) => {
    const response = await API.patch(`/api/projects/${projectId}`, updateData);
    return response.data;
};
