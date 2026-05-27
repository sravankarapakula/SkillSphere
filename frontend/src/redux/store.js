import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import profileReducer from "./slices/profileSlice";
import messageReducer from "./slices/messageSlice";
import projectReducer from "./slices/projectSlice";

const store = configureStore({
    reducer: {
        auth: authReducer,
        profile: profileReducer,
        message: messageReducer,
        project: projectReducer
    },
    devTools: import.meta.env.DEV
});

export default store;
