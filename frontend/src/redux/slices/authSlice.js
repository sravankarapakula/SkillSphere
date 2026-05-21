import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authApi from "../../api/authApi";

// Load persisted state from localStorage
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

const initialState = {
    user: user || null,
    token: token || null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: ""
};

// Register thunk
export const register = createAsyncThunk(
    "auth/register",
    async (userData, thunkAPI) => {
        try {
            const data = await authApi.registerUser(userData);
            if (data.success) {
                localStorage.setItem("token", data.data.token);
                localStorage.setItem("user", JSON.stringify(data.data.user));
            }
            return data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.errors?.[0]?.msg ||
                error.message ||
                "Registration failed";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Login thunk
export const login = createAsyncThunk(
    "auth/login",
    async (credentials, thunkAPI) => {
        try {
            const data = await authApi.loginUser(credentials);
            if (data.success) {
                localStorage.setItem("token", data.data.token);
                localStorage.setItem("user", JSON.stringify(data.data.user));
            }
            return data;
        } catch (error) {
            const message =
                error.response?.data?.message || error.message || "Login failed";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Load user from JWT thunk
export const loadUser = createAsyncThunk(
    "auth/loadUser",
    async (_, thunkAPI) => {
        try {
            const data = await authApi.getMe();
            if (data.success) {
                localStorage.setItem("user", JSON.stringify(data.data.user));
            }
            return data;
        } catch (error) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            const message =
                error.response?.data?.message || error.message || "Session expired";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Logout thunk
export const logout = createAsyncThunk("auth/logout", async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
});

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.isSuccess = false;
            state.message = "";
        },
        clearError: (state) => {
            state.isError = false;
            state.message = "";
        }
    },
    extraReducers: (builder) => {
        builder
            // Register
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload.data.user;
                state.token = action.payload.data.token;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
                state.token = null;
            })
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.message = "";
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload.data.user;
                state.token = action.payload.data.token;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
                state.token = null;
            })
            // Load User
            .addCase(loadUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(loadUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.data.user;
            })
            .addCase(loadUser.rejected, (state) => {
                state.isLoading = false;
                state.user = null;
                state.token = null;
            })
            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isSuccess = false;
            });
    }
});

export const { reset, clearError } = authSlice.actions;
export default authSlice.reducer;
