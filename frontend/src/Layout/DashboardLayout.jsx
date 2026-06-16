import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import SideBar from "../components/SideBar";
import Navbar from "../components/Navbar";
import { DashboardNavbarProvider } from "../contexts/DashboardNavbarContext";

const DashboardLayout = () => {
    const location = useLocation();

    const isFullScreenRoute =
        location.pathname.includes("canva-clone") ||
        location.pathname.includes("presentation-editor") ||
        location.pathname.includes("presentation-editor-v3");

    if (isFullScreenRoute) {
        return (
            <DashboardNavbarProvider>
                <div className="flex h-screen overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] text-[#121c2c]">
                    <main className="h-full w-full flex-1 overflow-hidden">
                        <Outlet />
                    </main>
                </div>
            </DashboardNavbarProvider>
        );
    }

    return (
        <DashboardNavbarProvider>
            {/* Outer shell — sidebar gutter */}
            <div className="flex h-screen overflow-hidden bg-[#e7eeff] font-['Plus_Jakarta_Sans',sans-serif] text-[#121c2c]">
                <SideBar />

                {/* Curved main panel */}
                <div className="relative mt-2 mb-2 mr-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/70 bg-[#f9f9ff] shadow-[0_8px_32px_rgba(0,94,161,0.06)]">
                    {/* Soft curved top gradient — mesh palette */}
                    <div
                        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[320px] rounded-t-2xl"
                        style={{
                            background:
                                "linear-gradient(180deg, #d0daf0 0%, #e7eeff 38%, #f0f3ff 62%, #f9f9ff 88%, transparent 100%)",
                        }}
                    />

                    {/* Ambient glow */}
                    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl opacity-30">
                        <div className="absolute -right-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-[#005ea1]/20 blur-[120px]" />
                        <div className="absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-[#ffb55c]/15 blur-[100px]" />
                    </div>

                    <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
                        <Navbar />

                        <main className="w-full flex-1 px-4 pb-24 sm:px-6 md:pb-6 lg:px-8 xl:px-10">
                            <Outlet />
                        </main>
                    </div>
                </div>
            </div>
        </DashboardNavbarProvider>
    );
};

export default DashboardLayout;
