import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as adminApi from "../../api/adminApi";

const initialState = {
    list: [],
    detail: null,
    analytics: null,
    pagination: null,
    isLoading: false,
    isMutating: false,
    error: ""
};

const errorMessage = (error, fallback) =>
    error.response?.data?.message ||
    error.response?.data?.errors?.[0]?.msg ||
    error.message ||
    fallback;

export const fetchAdminUsers = createAsyncThunk("admin/fetchUsers", async (params, thunkAPI) => {
    try {
        return await adminApi.getUsers(params);
    } catch (error) {
        return thunkAPI.rejectWithValue(errorMessage(error, "Could not load users"));
    }
});

export const fetchAdminUserDetails = createAsyncThunk("admin/fetchUserDetails", async (userId, thunkAPI) => {
    try {
        return await adminApi.getUserDetails(userId);
    } catch (error) {
        return thunkAPI.rejectWithValue(errorMessage(error, "Could not load user details"));
    }
});

export const fetchAdminGigs = createAsyncThunk("admin/fetchGigs", async (params, thunkAPI) => {
    try {
        return await adminApi.getGigs(params);
    } catch (error) {
        return thunkAPI.rejectWithValue(errorMessage(error, "Could not load gigs"));
    }
});

export const fetchAdminProjects = createAsyncThunk("admin/fetchProjects", async (params, thunkAPI) => {
    try {
        return await adminApi.getProjects(params);
    } catch (error) {
        return thunkAPI.rejectWithValue(errorMessage(error, "Could not load projects"));
    }
});

export const fetchAdminProjectDetails = createAsyncThunk("admin/fetchProjectDetails", async (projectId, thunkAPI) => {
    try {
        return await adminApi.getProjectDetails(projectId);
    } catch (error) {
        return thunkAPI.rejectWithValue(errorMessage(error, "Could not load project details"));
    }
});

export const fetchAdminReviews = createAsyncThunk("admin/fetchReviews", async (params, thunkAPI) => {
    try {
        return await adminApi.getReviews(params);
    } catch (error) {
        return thunkAPI.rejectWithValue(errorMessage(error, "Could not load reviews"));
    }
});

export const fetchAdminReviewDetails = createAsyncThunk("admin/fetchReviewDetails", async (reviewId, thunkAPI) => {
    try {
        return await adminApi.getReviewDetails(reviewId);
    } catch (error) {
        return thunkAPI.rejectWithValue(errorMessage(error, "Could not load review details"));
    }
});

export const fetchAdminDeliverables = createAsyncThunk("admin/fetchDeliverables", async (params, thunkAPI) => {
    try {
        return await adminApi.getDeliverables(params);
    } catch (error) {
        return thunkAPI.rejectWithValue(errorMessage(error, "Could not load deliverables"));
    }
});

export const fetchAdminDeliverableDetails = createAsyncThunk("admin/fetchDeliverableDetails", async (deliverableId, thunkAPI) => {
    try {
        return await adminApi.getDeliverableDetails(deliverableId);
    } catch (error) {
        return thunkAPI.rejectWithValue(errorMessage(error, "Could not load deliverable details"));
    }
});

export const fetchAdminAnalytics = createAsyncThunk("admin/fetchAnalytics", async (_, thunkAPI) => {
    try {
        return await adminApi.getAnalytics();
    } catch (error) {
        return thunkAPI.rejectWithValue(errorMessage(error, "Could not load analytics"));
    }
});

const adminSlice = createSlice({
    name: "admin",
    initialState,
    reducers: {
        clearAdminDetail: (state) => {
            state.detail = null;
            state.error = "";
        }
    },
    extraReducers: (builder) => {
        const listCases = [
            [fetchAdminUsers, "users"],
            [fetchAdminGigs, "gigs"],
            [fetchAdminProjects, "projects"],
            [fetchAdminReviews, "reviews"],
            [fetchAdminDeliverables, "deliverables"]
        ];

        listCases.forEach(([thunk, key]) => {
            builder
                .addCase(thunk.pending, (state) => {
                    state.isLoading = true;
                    state.error = "";
                })
                .addCase(thunk.fulfilled, (state, action) => {
                    state.isLoading = false;
                    state.list = action.payload.data[key] || [];
                    state.pagination = action.payload.data.pagination || null;
                })
                .addCase(thunk.rejected, (state, action) => {
                    state.isLoading = false;
                    state.error = action.payload;
                });
        });

        [
            fetchAdminUserDetails,
            fetchAdminProjectDetails,
            fetchAdminReviewDetails,
            fetchAdminDeliverableDetails
        ].forEach((thunk) => {
            builder
                .addCase(thunk.pending, (state) => {
                    state.isLoading = true;
                    state.error = "";
                    state.detail = null;
                })
                .addCase(thunk.fulfilled, (state, action) => {
                    state.isLoading = false;
                    state.detail = action.payload.data;
                })
                .addCase(thunk.rejected, (state, action) => {
                    state.isLoading = false;
                    state.error = action.payload;
                });
        });

        builder
            .addCase(fetchAdminAnalytics.pending, (state) => {
                state.isLoading = true;
                state.error = "";
            })
            .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
                state.isLoading = false;
                state.analytics = action.payload.data;
            })
            .addCase(fetchAdminAnalytics.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    }
});

export const { clearAdminDetail } = adminSlice.actions;
export default adminSlice.reducer;
