import API from "./axiosInstance";

export const submitProposal = async (proposalData) => {
    const response = await API.post("/api/proposals", proposalData);
    return response.data;
};

export const getMyProposals = async () => {
    const response = await API.get("/api/proposals/my");
    return response.data;
};

export const getGigProposals = async (gigId) => {
    const response = await API.get(`/api/proposals/gig/${gigId}`);
    return response.data;
};

export const updateProposalStatus = async (proposalId, status) => {
    const response = await API.patch(`/api/proposals/${proposalId}/status`, { status });
    return response.data;
};
