import React from "react";
import SideBar from "../components/SideBar";
import TopNavbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <div className="bg-slate-950 min-h-screen text-white">

      {/* Sidebar */}
      <SideBar />

      {/* Navbar */}
      <TopNavbar />

      {/* Page Content */}
      <main className="ml-[63px] pt-[60px] p-4">
        <Outlet />
      </main>

    </div>
  );
};

export default AppLayout;