import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as reviewApi from "../../api/reviewApi";

const initialState = {
    reviews: [],
    reviewStatus: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: ""
};

// Submit a review
export const submitReview = createAsyncThunk(
    "review/submitReview",
    async (reviewData, thunkAPI) => {
        try {
            const data = await reviewApi.createReview(reviewData);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to submit review";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Fetch reviews for a project
export const fetchProjectReviews = createAsyncThunk(
    "review/fetchProjectReviews",
    async (projectId, thunkAPI) => {
        try {
            const data = await reviewApi.getProjectReviews(projectId);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to load reviews";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Fetch reviews for a user
export const fetchUserReviews = createAsyncThunk(
    "review/fetchUserReviews",
    async (userId, thunkAPI) => {
        try {
            const data = await reviewApi.getUserReviews(userId);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to load user reviews";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Fetch review status for a project
export const fetchReviewStatus = createAsyncThunk(
    "review/fetchReviewStatus",
    async (projectId, thunkAPI) => {
        try {
            const data = await reviewApi.getReviewStatus(projectId);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to load review status";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const reviewSlice = createSlice({
    name: "review",
    initialState,
    reducers: {
        resetReviewState: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = "";
        },
        applySocketReviewCreated: (state, action) => {
            const review = action.payload.review || action.payload;
            if (review && !state.reviews.some((r) => r._id === review._id)) {
                state.reviews = [review, ...state.reviews];
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Submit Review
            .addCase(submitReview.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(submitReview.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const review = action.payload.data?.review || action.payload.data;
                if (review) {
                    state.reviews = [review, ...state.reviews];
                }
            })
            .addCase(submitReview.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Fetch Project Reviews
            .addCase(fetchProjectReviews.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(fetchProjectReviews.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.reviews = action.payload.data?.reviews || action.payload.data || [];
            })
            .addCase(fetchProjectReviews.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Fetch User Reviews
            .addCase(fetchUserReviews.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(fetchUserReviews.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.reviews = action.payload.data?.reviews || action.payload.data || [];
            })
            .addCase(fetchUserReviews.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Fetch Review Status
            .addCase(fetchReviewStatus.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(fetchReviewStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.reviewStatus = action.payload.data;
            })
            .addCase(fetchReviewStatus.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    }
});

export const { resetReviewState, applySocketReviewCreated } = reviewSlice.actions;
export default reviewSlice.reducer;
