import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as projectApi from "../../api/projectApi";

const initialState = {
    projects: [],
    currentProject: null,
    currentConversation: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: ""
};

// Fetch user projects
export const fetchUserProjects = createAsyncThunk(
    "project/fetchUserProjects",
    async (_, thunkAPI) => {
        try {
            const data = await projectApi.getUserProjects();
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to load projects";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Fetch project by ID
export const fetchProjectById = createAsyncThunk(
    "project/fetchProjectById",
    async (projectId, thunkAPI) => {
        try {
            const data = await projectApi.getProjectById(projectId);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to load project details";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update project details
export const updateProjectDetails = createAsyncThunk(
    "project/updateProject",
    async ({ projectId, updateData }, thunkAPI) => {
        try {
            const data = await projectApi.updateProject(projectId, updateData);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to update project";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const projectSlice = createSlice({
    name: "project",
    initialState,
    reducers: {
        resetProjectState: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = "";
        },
        applySocketProjectUpdate: (state, action) => {
            const updated = action.payload.project;
            if (updated) {
                state.projects = state.projects.map((p) =>
                    p._id === updated._id ? { ...p, ...updated } : p
                );
                if (state.currentProject && state.currentProject._id === updated._id) {
                    state.currentProject = { ...state.currentProject, ...updated };
                }
            }
        },
        applySocketProjectCreated: (state, action) => {
            const created = action.payload.project;
            if (created && !state.projects.some((p) => p._id === created._id)) {
                state.projects = [created, ...state.projects];
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch User Projects
            .addCase(fetchUserProjects.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(fetchUserProjects.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.projects = action.payload.data.projects;
            })
            .addCase(fetchUserProjects.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Fetch Project By ID
            .addCase(fetchProjectById.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(fetchProjectById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentProject = action.payload.data.project;
                state.currentConversation = action.payload.data.conversation;
            })
            .addCase(fetchProjectById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.currentProject = null;
                state.currentConversation = null;
            })
            // Update Project Details
            .addCase(updateProjectDetails.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(updateProjectDetails.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const updated = action.payload.data.project;
                state.projects = state.projects.map((p) =>
                    p._id === updated._id ? { ...p, ...updated } : p
                );
                if (state.currentProject && state.currentProject._id === updated._id) {
                    state.currentProject = { ...state.currentProject, ...updated };
                }
            })
            .addCase(updateProjectDetails.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    }
});

export const { resetProjectState, applySocketProjectUpdate, applySocketProjectCreated } = projectSlice.actions;
export default projectSlice.reducer;
