import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import profileReducer from "./slices/profileSlice";
import messageReducer from "./slices/messageSlice";
import projectReducer from "./slices/projectSlice";
import milestoneReducer from "./slices/milestoneSlice";
import deliverableReducer from "./slices/deliverableSlice";
import reviewReducer from "./slices/reviewSlice";
import adminReducer from "./slices/adminSlice";

const store = configureStore({
    reducer: {
        auth: authReducer,
        profile: profileReducer,
        message: messageReducer,
        project: projectReducer,
        milestone: milestoneReducer,
        deliverable: deliverableReducer,
        review: reviewReducer,
        admin: adminReducer
    },
    devTools: import.meta.env.DEV
});

export default store;

