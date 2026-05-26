import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import SideBar from "../components/SideBar";
import Navbar from "../components/Navbar";

const DashboardLayout = () => {
    const location = useLocation();

    const isFullScreenRoute =
        location.pathname.includes("canva-clone") ||
        location.pathname.includes("presentation-editor") ||
        location.pathname.includes("presentation-editor-v3");

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">

            {/* Sidebar */}
            {!isFullScreenRoute && <SideBar />}

            {/* Main Content Wrapper */}
            <div className="relative flex flex-1 flex-col bg-white rounded-2xl mt-2 md:mt-2 overflow-hidden shadow-sm border border-slate-200/80 backdrop-blur-md hover:shadow-lg transition-all duration-300 hover:border-slate-200/90">

                {/* Gradient */}
                <div
                    className="
    absolute top-0 left-0 w-full h-[320px]
    bg-linear-to-b
    from-[#3be0f6]
    via-[#98e2ea]
    via-60%
    to-white
    opacity-90
    z-0
  "
                />

                {/* Scrollable Area */}
                <div className="relative z-10 flex flex-col flex-1 overflow-y-auto">

                    {/* Navbar */}
                    {!isFullScreenRoute && (
                        <header className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-2 shrink-0">
                            <Navbar />
                        </header>
                    )}

                    {/* Page Content */}
                    <main className="flex-1 w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 md:py-6 pb-24 md:pb-6">
                        <Outlet />
                    </main>

                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
