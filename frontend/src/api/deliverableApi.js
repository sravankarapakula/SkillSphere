import API from "./axiosInstance";

/**
 * Submit deliverables for a milestone.
 * Uses FormData for multipart file upload.
 */
export const submitDeliverables = async (milestoneId, formData) => {
    const response = await API.post(`/api/deliverables/${milestoneId}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000 // 2 min timeout for large uploads
    });
    return response.data;
};

/**
 * Get all deliverables (version history) for a milestone.
 */
export const getDeliverables = async (milestoneId) => {
    const response = await API.get(`/api/deliverables/${milestoneId}`);
    return response.data;
};

/**
 * Get a single deliverable by ID.
 */
export const getDeliverableById = async (deliverableId) => {
    const response = await API.get(`/api/deliverables/detail/${deliverableId}`);
    return response.data;
};

/**
 * Review a deliverable (approve or reject).
 * @param {string} deliverableId
 * @param {{ action: "approve"|"reject", feedback?: string }} reviewData
 */
export const reviewDeliverable = async (deliverableId, reviewData) => {
    const response = await API.patch(`/api/deliverables/${deliverableId}/review`, reviewData);
    return response.data;
};
