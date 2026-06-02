import API from "../api/axiosInstance";

export const createOrder = async (projectId) => {
    const response = await API.post("/api/payments/create-order", { projectId });
    return response.data;
};

export const verifyPayment = async (paymentData) => {
    const response = await API.post("/api/payments/verify", paymentData);
    return response.data;
};

export const getMyPayments = async () => {
    const response = await API.get("/api/payments/my");
    return response.data;
};

export const getProjectPayment = async (projectId) => {
    const response = await API.get(`/api/payments/project/${projectId}`);
    return response.data;
};
