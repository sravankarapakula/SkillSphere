import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as profileApi from "../../api/profileApi";

const initialState = {
    profile: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: ""
};

// Fetch my profile
export const fetchMyProfile = createAsyncThunk(
    "profile/fetchMy",
    async (_, thunkAPI) => {
        try {
            const data = await profileApi.getMyProfile();
            return data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to fetch profile";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update profile
export const updateProfile = createAsyncThunk(
    "profile/update",
    async (profileData, thunkAPI) => {
        try {
            const data = await profileApi.updateProfile(profileData);
            return data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to update profile";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Upload profile image
export const uploadImage = createAsyncThunk(
    "profile/uploadImage",
    async (formData, thunkAPI) => {
        try {
            const data = await profileApi.uploadProfileImage(formData);
            return data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to upload image";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Upload resume
export const uploadResume = createAsyncThunk(
    "profile/uploadResume",
    async (formData, thunkAPI) => {
        try {
            const data = await profileApi.uploadResume(formData);
            return data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to upload resume";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Add portfolio item
export const addPortfolio = createAsyncThunk(
    "profile/addPortfolio",
    async (formData, thunkAPI) => {
        try {
            const data = await profileApi.addPortfolioItem(formData);
            return data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to add portfolio item";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Remove portfolio item
export const removePortfolio = createAsyncThunk(
    "profile/removePortfolio",
    async (itemId, thunkAPI) => {
        try {
            const data = await profileApi.removePortfolioItem(itemId);
            return data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Failed to remove portfolio item";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const profileSlice = createSlice({
    name: "profile",
    initialState,
    reducers: {
        resetProfile: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = "";
        },
        clearProfile: () => initialState
    },
    extraReducers: (builder) => {
        builder
            // Fetch profile
            .addCase(fetchMyProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchMyProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.profile = action.payload.data.profile;
            })
            .addCase(fetchMyProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update profile
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.profile = action.payload.data.profile;
                state.message = "Profile updated successfully";
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Upload image
            .addCase(uploadImage.fulfilled, (state, action) => {
                if (state.profile) {
                    state.profile.profileImage = action.payload.data.imageUrl;
                }
                state.isSuccess = true;
                state.message = "Image uploaded";
            })
            .addCase(uploadImage.rejected, (state, action) => {
                state.isError = true;
                state.message = action.payload;
            })
            // Upload resume
            .addCase(uploadResume.fulfilled, (state, action) => {
                if (state.profile) {
                    state.profile.resume = action.payload.data.resumeUrl;
                }
                state.isSuccess = true;
                state.message = "Resume uploaded";
            })
            .addCase(uploadResume.rejected, (state, action) => {
                state.isError = true;
                state.message = action.payload;
            })
            // Add portfolio
            .addCase(addPortfolio.fulfilled, (state, action) => {
                if (state.profile) {
                    state.profile.portfolio = action.payload.data.portfolio;
                }
                state.isSuccess = true;
                state.message = "Portfolio item added";
            })
            .addCase(addPortfolio.rejected, (state, action) => {
                state.isError = true;
                state.message = action.payload;
            })
            // Remove portfolio
            .addCase(removePortfolio.fulfilled, (state, action) => {
                if (state.profile) {
                    state.profile.portfolio = action.payload.data.portfolio;
                }
                state.isSuccess = true;
                state.message = "Portfolio item removed";
            })
            .addCase(removePortfolio.rejected, (state, action) => {
                state.isError = true;
                state.message = action.payload;
            });
    }
});

export const { resetProfile, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
