import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="h-screen bg-surface-50 flex overflow-hidden">
            {/* Sidebar — sticky on desktop, drawer on mobile */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main content area — takes remaining width, scrollable */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top navbar — sticky within this column */}
                <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                {/* Scrollable page content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
