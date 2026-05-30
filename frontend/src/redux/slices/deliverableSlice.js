import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as deliverableApi from "../../api/deliverableApi";

export const submitNewDeliverables = createAsyncThunk(
    "deliverable/submitNewDeliverables",
    async ({ milestoneId, formData }, { rejectWithValue }) => {
        try {
            const data = await deliverableApi.submitDeliverables(milestoneId, formData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to submit deliverables");
        }
    }
);

export const fetchDeliverables = createAsyncThunk(
    "deliverable/fetchDeliverables",
    async (milestoneId, { rejectWithValue }) => {
        try {
            const data = await deliverableApi.getDeliverables(milestoneId);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch deliverables");
        }
    }
);

export const fetchDeliverableById = createAsyncThunk(
    "deliverable/fetchDeliverableById",
    async (deliverableId, { rejectWithValue }) => {
        try {
            const data = await deliverableApi.getDeliverableById(deliverableId);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch deliverable");
        }
    }
);

export const reviewExistingDeliverable = createAsyncThunk(
    "deliverable/reviewExistingDeliverable",
    async ({ deliverableId, reviewData }, { rejectWithValue }) => {
        try {
            const data = await deliverableApi.reviewDeliverable(deliverableId, reviewData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to review deliverable");
        }
    }
);

const initialState = {
    deliverables: [],
    selectedDeliverable: null,
    totalVersions: 0,
    milestoneStatus: null,
    isLoading: false,
    isSubmitting: false,
    isReviewing: false,
    isError: false,
    message: "",
    lastUpdated: null
};

const deliverableSlice = createSlice({
    name: "deliverable",
    initialState,
    reducers: {
        resetDeliverableState: () => initialState,
        setSelectedDeliverable: (state, action) => {
            state.selectedDeliverable = action.payload;
        },
        clearDeliverableError: (state) => {
            state.isError = false;
            state.message = "";
        },
        applyDeliverableSubmitted: (state, action) => {
            const { deliverable } = action.payload;
            if (deliverable) {
                // Add to front (newest first)
                const exists = state.deliverables.some(d => d._id === deliverable._id);
                if (!exists) {
                    state.deliverables.unshift(deliverable);
                    state.totalVersions = state.deliverables.length;
                }
                state.lastUpdated = Date.now();
            }
        },
        applyDeliverableReviewed: (state, action) => {
            const { deliverable } = action.payload;
            if (deliverable) {
                const index = state.deliverables.findIndex(d => d._id === deliverable._id);
                if (index !== -1) {
                    state.deliverables[index] = deliverable;
                } else {
                    state.deliverables.unshift(deliverable);
                }
                if (state.selectedDeliverable?._id === deliverable._id) {
                    state.selectedDeliverable = deliverable;
                }
                state.lastUpdated = Date.now();
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Submit
            .addCase(submitNewDeliverables.pending, (state) => {
                state.isSubmitting = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(submitNewDeliverables.fulfilled, (state, action) => {
                state.isSubmitting = false;
                const deliverable = action.payload.data?.deliverable;
                if (deliverable) {
                    const exists = state.deliverables.some(d => d._id === deliverable._id);
                    if (!exists) {
                        state.deliverables.unshift(deliverable);
                        state.totalVersions = state.deliverables.length;
                    }
                }
                state.lastUpdated = Date.now();
            })
            .addCase(submitNewDeliverables.rejected, (state, action) => {
                state.isSubmitting = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Fetch all
            .addCase(fetchDeliverables.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(fetchDeliverables.fulfilled, (state, action) => {
                state.isLoading = false;
                state.deliverables = action.payload.data?.deliverables || [];
                state.totalVersions = action.payload.data?.totalVersions || 0;
                state.milestoneStatus = action.payload.data?.milestoneStatus || null;
            })
            .addCase(fetchDeliverables.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Fetch single
            .addCase(fetchDeliverableById.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(fetchDeliverableById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedDeliverable = action.payload.data?.deliverable || null;
            })
            .addCase(fetchDeliverableById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Review
            .addCase(reviewExistingDeliverable.pending, (state) => {
                state.isReviewing = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(reviewExistingDeliverable.fulfilled, (state, action) => {
                state.isReviewing = false;
                const deliverable = action.payload.data?.deliverable;
                if (deliverable) {
                    const index = state.deliverables.findIndex(d => d._id === deliverable._id);
                    if (index !== -1) {
                        state.deliverables[index] = deliverable;
                    }
                    if (state.selectedDeliverable?._id === deliverable._id) {
                        state.selectedDeliverable = deliverable;
                    }
                }
                state.lastUpdated = Date.now();
            })
            .addCase(reviewExistingDeliverable.rejected, (state, action) => {
                state.isReviewing = false;
                state.isError = true;
                state.message = action.payload;
            });
    }
});

export const {
    resetDeliverableState,
    setSelectedDeliverable,
    clearDeliverableError,
    applyDeliverableSubmitted,
    applyDeliverableReviewed
} = deliverableSlice.actions;

export default deliverableSlice.reducer;
