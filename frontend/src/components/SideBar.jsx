import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Plus } from "lucide-react";
import CreatePopup from "./homepage/CreatePopup";
import { FiHelpCircle } from "react-icons/fi";


/* ---------- ICONS ---------- */

const HomeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5L12 3l9 7.5"></path>
    <path d="M5 10v10h5v-6h4v6h5V10"></path>
  </svg>
);

const PPTIcon = ({ size = 20, active }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "white" : "currentColor"} strokeWidth="1.176" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.99787498 9 L4.99787498 1 L19.5 1 L23 4.5 L23 23 L4 23" />
    <path d="M18 1 L18 6 L23 6" />
    <path d="M4 12 L4.25 12 L5.5 12 C7.5 12 9 12.5 9 14.25 C9 16 7.5 16.5 5.5 16.5 L4.25 16.5 L4.25 19 L4 19 L4 12 Z" />
  </svg>
);

const ImageIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <rect x="3" y="3" width="18" height="18" rx="3"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <path d="M21 15l-5-5-4 4-3-3-6 6"></path>
  </svg>
);

const FolderIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"></path>
  </svg>
);

const AnalyticsIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M4 20V10"></path>
    <path d="M10 20V4"></path>
    <path d="M16 20v-6"></path>
    <path d="M22 20v-3"></path>
  </svg>
);

const AdminIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M12 3l7 4v5c0 5-3 8-7 9-4-1-7-4-7-9V7l7-4z"></path>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

/* ---------------- NAV ITEMS ---------------- */

const BASE_ITEMS = [
  { label: "Home", path: "/dashboard/home", icon: <HomeIcon /> },
  { label: "PPT", path: "/dashboard/presentation", icon: <PPTIcon /> },
  { label: "Image", path: "/dashboard/create-image", icon: <ImageIcon /> },
  { label: "Files", path: "/dashboard/projects", icon: <FolderIcon /> },
  { label: "Analytics", path: "/dashboard/analytics", icon: <AnalyticsIcon /> }
];


const RailItem = ({ active, label, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 rounded-lg
min-w-[48px] transition-all duration-150
${active ? 'text-blue-700' : 'text-gray-600 hover:bg-blue-500/10'}`}
    >
      <div
        className={`flex h-[24px] w-[24px] items-center justify-center rounded-xl backdrop-blur-md transition-all duration-200
${active
            ? 'bg-gradient-to-br from-blue-600/95 to-cyan-500/90 text-white shadow-[0_12px_30px_rgba(37,99,235,0.35),0_0_0_6px_rgba(59,130,246,0.10)]'
            : 'bg-white/55 text-gray-700 group-hover:bg-white/75 group-hover:shadow-lg'}`}
      >
        {React.cloneElement(icon, { active })}
      </div>

      <span className={`hidden md:block text-[10px] text-center tracking-wide ${active ? 'font-bold opacity-100' : 'font-semibold opacity-90'
        }`}>
        {label}
      </span>
    </button>
  );
};

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [showCreate, setShowCreate] = useState(false);


  const ITEMS = useMemo(() => {
    if (!isAdmin) return BASE_ITEMS;
    return [
      ...BASE_ITEMS,
      {
        label: "Admin",
        path: "/dashboard/admin-dash",
        icon: <AdminIcon />
      }
    ];
  }, [isAdmin]);

  return (
    <>
      <aside
        className={`
                fixed z-[9999] flex items-center gap-0 md:gap-2 xl:gap-4
                bottom-3 left-1/2 -translate-x-1/2 w-[95%] 
                px-2 py-1.5 rounded-xl
                bg-white/90 backdrop-blur-xl shadow-lg border border-white/50
                flex-row justify-between
                md:relative md:left-0 md:top-0 md:bottom-0 md:translate-x-0 md:translate-y-0 
                md:h-screen md:w-20 md:flex-col md:justify-start md:py-8 md:px-0 
                md:overflow-y-auto md:rounded-none md:bg-transparent md:shadow-none md:border-none
        `}
      >
        <div className="flex items-center justify-center">
          <button
            onClick={() => setShowCreate(true)}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
    bg-gradient-to-br from-blue-600 to-cyan-500 text-white
    shadow-lg shadow-blue-500/30 active:scale-95 transition"
          >
            <Plus size={18} />
          </button>
        </div>

        {ITEMS.map((item) => (
          <RailItem
            key={item.path}
            label={item.label}
            icon={item.icon}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
        <div className="flex justify-center w-full  items-center">
          <button
            onClick={() => navigate("/dashboard/help-support")}
            className="md:flex w-8 h-8 rounded-lg items-center justify-center text-slate-600 cursor-pointer transition"
          >
            <FiHelpCircle size={22} color='gray' />
          </button>
        </div>

      </aside>

      {/* 4. Render the Popup and pass the state props */}
      <CreatePopup
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
      />

    </>
  );
};

export default SideBar;