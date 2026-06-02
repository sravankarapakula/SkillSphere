import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as paymentApi from "../../services/paymentApi";

const initialState = {
    payments: [],
    currentPayment: null,
    loading: false,
    error: null,
    success: false
};

// Create Razorpay Order
export const createPaymentOrder = createAsyncThunk(
    "payment/createOrder",
    async (projectId, thunkAPI) => {
        try {
            const data = await paymentApi.createOrder(projectId);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to create order";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Verify Razorpay Payment Signature
export const verifyPaymentSignature = createAsyncThunk(
    "payment/verify",
    async (paymentData, thunkAPI) => {
        try {
            const data = await paymentApi.verifyPayment(paymentData);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to verify signature";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Fetch User Payments (Role-based)
export const fetchMyPayments = createAsyncThunk(
    "payment/fetchMyPayments",
    async (_, thunkAPI) => {
        try {
            const data = await paymentApi.getMyPayments();
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to load payments";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Fetch Specific Project Payment details
export const fetchProjectPaymentDetails = createAsyncThunk(
    "payment/fetchProjectPayment",
    async (projectId, thunkAPI) => {
        try {
            const data = await paymentApi.getProjectPayment(projectId);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to load project payment details";
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const paymentSlice = createSlice({
    name: "payment",
    initialState,
    reducers: {
        resetPaymentState: (state) => {
            state.loading = false;
            state.error = null;
            state.success = false;
        },
        receiveSocketPaymentSuccess: (state, action) => {
            const { payment } = action.payload;
            if (payment) {
                // If payment belongs in my list, update or add it
                if (!state.payments.some((p) => p._id === payment._id)) {
                    state.payments = [payment, ...state.payments];
                }
                state.currentPayment = payment;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Create Order
            .addCase(createPaymentOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createPaymentOrder.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(createPaymentOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Verify Signature
            .addCase(verifyPaymentSignature.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(verifyPaymentSignature.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.currentPayment = action.payload.data?.payment || null;
            })
            .addCase(verifyPaymentSignature.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch My Payments
            .addCase(fetchMyPayments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyPayments.fulfilled, (state, action) => {
                state.loading = false;
                state.payments = action.payload.data?.payments || [];
            })
            .addCase(fetchMyPayments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Project Payment
            .addCase(fetchProjectPaymentDetails.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProjectPaymentDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPayment = action.payload.data?.payment || null;
            })
            .addCase(fetchProjectPaymentDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.currentPayment = null;
            });
    }
});

export const { resetPaymentState, receiveSocketPaymentSuccess } = paymentSlice.actions;
export default paymentSlice.reducer;
