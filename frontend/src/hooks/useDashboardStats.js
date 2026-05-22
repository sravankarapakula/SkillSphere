import { useEffect, useState } from "react";
import * as dashboardApi from "../api/dashboardApi";

const DASHBOARD_REFRESH_EVENT = "skillsphere:dashboard-refresh";
const REFRESH_INTERVAL = 15000;

const usePollingDashboard = (loader) => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        const refresh = async (showLoading = false) => {
            try {
                if (showLoading && active) {
                    setIsLoading(true);
                }
                const data = await loader();

                if (active) {
                    setStats(data.data);
                    setError("");
                }
            } catch (apiError) {
                if (active) {
                    setError(apiError.response?.data?.message || "Dashboard stats unavailable.");
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        const handleRefresh = () => refresh(false);
        refresh(true);

        const intervalId = window.setInterval(handleRefresh, REFRESH_INTERVAL);
        window.addEventListener(DASHBOARD_REFRESH_EVENT, handleRefresh);

        return () => {
            active = false;
            window.clearInterval(intervalId);
            window.removeEventListener(DASHBOARD_REFRESH_EVENT, handleRefresh);
        };
    }, [loader]);

    return { stats, isLoading, error };
};

export const requestDashboardRefresh = () => {
    window.dispatchEvent(new Event(DASHBOARD_REFRESH_EVENT));
};

export const useClientDashboard = () =>
    usePollingDashboard(dashboardApi.getClientDashboard);

export const useFreelancerDashboard = () =>
    usePollingDashboard(dashboardApi.getFreelancerDashboard);

export const useAdminDashboard = () =>
    usePollingDashboard(dashboardApi.getAdminDashboard);
