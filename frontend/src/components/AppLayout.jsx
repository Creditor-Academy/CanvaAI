import React from "react";
import SideBar from "../components/SideBar";
import TopNavbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import { useSidebar } from "../contexts/SidebarContext";

const AppLayout = () => {
  const { isMobile, isCollapsed } = useSidebar();

  // Calculate main content margin based on sidebar state
  const getMainMargin = () => {
    if (isMobile) return "ml-0";
    return isCollapsed ? "ml-[63px]" : "ml-[260px]";
  };

  return (
    <div className="bg-slate-950 min-h-screen text-white">
      {/* Sidebar */}
      <SideBar />

      {/* Navbar */}
      <TopNavbar />

      {/* Page Content - Responsive margins */}
      <main 
        className={`pt-[60px] p-4 transition-all duration-250 ease-in-out ${getMainMargin()}`}
        style={{
          marginLeft: isMobile ? '0' : (isCollapsed ? '63px' : '260px')
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;