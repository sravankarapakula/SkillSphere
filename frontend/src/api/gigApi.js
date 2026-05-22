import API from "./axiosInstance";

export const getGigs = async (params) => {
    const response = await API.get("/api/gigs", { params });
    return response.data;
};

export const getGig = async (gigId) => {
    const response = await API.get(`/api/gigs/${gigId}`);
    return response.data;
};

export const getMyGigs = async (params) => {
    const response = await API.get("/api/gigs/my", { params });
    return response.data;
};

export const createGig = async (gigData) => {
    const response = await API.post("/api/gigs", gigData);
    return response.data;
};

export const updateGig = async (gigId, gigData) => {
    const response = await API.put(`/api/gigs/${gigId}`, gigData);
    return response.data;
};

export const deleteGig = async (gigId) => {
    const response = await API.delete(`/api/gigs/${gigId}`);
    return response.data;
};
