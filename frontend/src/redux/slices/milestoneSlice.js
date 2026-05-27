import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as milestoneApi from "../../api/milestoneApi";

export const fetchProjectMilestones = createAsyncThunk(
    "milestone/fetchProjectMilestones",
    async (projectId, { rejectWithValue }) => {
        try {
            const data = await milestoneApi.getProjectMilestones(projectId);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch milestones");
        }
    }
);

export const createNewMilestone = createAsyncThunk(
    "milestone/createNewMilestone",
    async (data, { rejectWithValue }) => {
        try {
            const response = await milestoneApi.createMilestone(data);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create milestone");
        }
    }
);

export const editMilestone = createAsyncThunk(
    "milestone/editMilestone",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await milestoneApi.updateMilestone(id, data);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update milestone");
        }
    }
);

export const removeMilestone = createAsyncThunk(
    "milestone/removeMilestone",
    async (id, { rejectWithValue }) => {
        try {
            const response = await milestoneApi.deleteMilestone(id);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete milestone");
        }
    }
);

export const changeMilestoneStatus = createAsyncThunk(
    "milestone/changeMilestoneStatus",
    async ({ id, status }, { rejectWithValue }) => {
        try {
            const response = await milestoneApi.updateMilestoneStatus(id, status);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update status");
        }
    }
);

const initialState = {
    milestones: [],
    selectedMilestone: null,
    budgetInfo: { totalBudget: 0, allocatedBudget: 0, remainingBudget: 0 },
    isLoading: false,
    isError: false,
    message: "",
    lastUpdated: null
};

const recalculateBudget = (state) => {
    const totalBudget = state.budgetInfo.totalBudget;
    const allocatedBudget = state.milestones.reduce((sum, m) => sum + m.amount, 0);
    const remainingBudget = totalBudget - allocatedBudget;
    state.budgetInfo.allocatedBudget = allocatedBudget;
    state.budgetInfo.remainingBudget = remainingBudget;
};

const milestoneSlice = createSlice({
    name: "milestone",
    initialState,
    reducers: {
        resetMilestoneState: () => initialState,
        setSelectedMilestone: (state, action) => {
            state.selectedMilestone = action.payload;
        },
        applyMilestoneCreated: (state, action) => {
            const { milestone } = action.payload;
            if (milestone && !state.milestones.some(m => m._id === milestone._id)) {
                state.milestones.push(milestone);
                recalculateBudget(state);
                state.lastUpdated = Date.now();
            }
        },
        applyMilestoneUpdated: (state, action) => {
            const { milestone } = action.payload;
            if (milestone) {
                const index = state.milestones.findIndex(m => m._id === milestone._id);
                if (index !== -1) {
                    state.milestones[index] = milestone;
                } else {
                    state.milestones.push(milestone);
                }
                recalculateBudget(state);
                state.lastUpdated = Date.now();
            }
        },
        applyMilestoneDeleted: (state, action) => {
            const { milestoneId } = action.payload;
            if (milestoneId) {
                state.milestones = state.milestones.filter(m => m._id !== milestoneId);
                recalculateBudget(state);
                state.lastUpdated = Date.now();
            }
        },
        applyMilestoneStatusChanged: (state, action) => {
            const { milestone } = action.payload;
            if (milestone) {
                const index = state.milestones.findIndex(m => m._id === milestone._id);
                if (index !== -1) {
                    state.milestones[index] = {
                        ...state.milestones[index],
                        ...milestone
                    };
                }
                state.lastUpdated = Date.now();
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProjectMilestones.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(fetchProjectMilestones.fulfilled, (state, action) => {
                state.isLoading = false;
                state.milestones = action.payload.data.milestones || [];
                state.budgetInfo = action.payload.data.budgetInfo || { totalBudget: 0, allocatedBudget: 0, remainingBudget: 0 };
            })
            .addCase(fetchProjectMilestones.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createNewMilestone.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(createNewMilestone.fulfilled, (state, action) => {
                state.isLoading = false;
                const milestone = action.payload.data.milestone;
                if (milestone && !state.milestones.some(m => m._id === milestone._id)) {
                    state.milestones.push(milestone);
                    recalculateBudget(state);
                }
            })
            .addCase(createNewMilestone.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(editMilestone.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(editMilestone.fulfilled, (state, action) => {
                state.isLoading = false;
                const milestone = action.payload.data.milestone;
                if (milestone) {
                    const index = state.milestones.findIndex(m => m._id === milestone._id);
                    if (index !== -1) {
                        state.milestones[index] = milestone;
                    }
                    recalculateBudget(state);
                }
            })
            .addCase(editMilestone.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(removeMilestone.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(removeMilestone.fulfilled, (state, action) => {
                state.isLoading = false;
                const milestoneId = action.payload.data?.milestoneId || action.meta?.arg;
                if (milestoneId) {
                    state.milestones = state.milestones.filter(m => m._id !== milestoneId);
                    recalculateBudget(state);
                }
            })
            .addCase(removeMilestone.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(changeMilestoneStatus.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(changeMilestoneStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                const milestone = action.payload.data.milestone;
                if (milestone) {
                    const index = state.milestones.findIndex(m => m._id === milestone._id);
                    if (index !== -1) {
                        state.milestones[index] = {
                            ...state.milestones[index],
                            ...milestone
                        };
                    }
                }
            })
            .addCase(changeMilestoneStatus.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    }
});

export const {
    resetMilestoneState,
    setSelectedMilestone,
    applyMilestoneCreated,
    applyMilestoneUpdated,
    applyMilestoneDeleted,
    applyMilestoneStatusChanged
} = milestoneSlice.actions;

export default milestoneSlice.reducer;
