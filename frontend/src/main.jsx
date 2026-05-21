import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import store from "./redux/store";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ErrorBoundary>
            <Provider store={store}>
                <BrowserRouter>
                    <App />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: "#1e293b",
                                color: "#f8fafc",
                                borderRadius: "12px",
                                fontSize: "14px",
                                padding: "12px 16px"
                            },
                            success: {
                                iconTheme: {
                                    primary: "#10b981",
                                    secondary: "#f8fafc"
                                }
                            },
                            error: {
                                iconTheme: {
                                    primary: "#ef4444",
                                    secondary: "#f8fafc"
                                }
                            }
                        }}
                    />
                </BrowserRouter>
            </Provider>
        </ErrorBoundary>
    </StrictMode>
);
