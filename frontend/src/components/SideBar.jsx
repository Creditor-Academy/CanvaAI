import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/* ---------- MODERN PREMIUM LINEAR ICONS ---------- */

const HomeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5L12 3l9 7.5"></path>
    <path d="M5 10v10h5v-6h4v6h5V10"></path>
  </svg>
);

const PPTIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="14" rx="2"></rect>
    <path d="M8 21h8"></path>
    <path d="M12 18v3"></path>
  </svg>
);

const EditorIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h4l10-10a2.5 2.5 0 10-4-4L4 16v4z"></path>
  </svg>
);

const ImageIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <path d="M21 15l-5-5-4 4-3-3-6 6"></path>
  </svg>
);

const FolderIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"></path>
  </svg>
);

const AnalyticsIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20V10"></path>
    <path d="M10 20V4"></path>
    <path d="M16 20v-6"></path>
    <path d="M22 20v-3"></path>
  </svg>
);

const AdminIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l7 4v5c0 5-3 8-7 9-4-1-7-4-7-9V7l7-4z"></path>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

/* ---------------- NAV ITEMS ---------------- */

const BASE_ITEMS = [
  { label: "Home", path: "/home", icon: <HomeIcon /> },
  { label: "PPT", path: "/presentation", icon: <PPTIcon /> },
  { label: "Editor", path: "/editor", icon: <EditorIcon /> },
  { label: "Image", path: "/create-image", icon: <ImageIcon /> },
  { label: "Files", path: "/projects", icon: <FolderIcon /> },
  { label: "Analytics", path: "/analytics", icon: <AnalyticsIcon /> }
];

/* ---------------- RAIL ITEM ---------------- */

const RailItem = ({ active, label, icon, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: 56,
      border: "none",
      background: "transparent",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      padding: "6px 0",
      cursor: "pointer",
      color: active ? "#1e40af" : "#4b5563",
      transition: "all .18s ease"
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active
          ? "rgba(59,130,246,0.9)"
          : "rgba(255,255,255,0.45)",
        color: active ? "#fff" : "#374151",
        backdropFilter: "blur(6px)",
        transition: "all .18s ease"
      }}
    >
      {icon}
    </div>

    <span
      style={{
        fontSize: 10,
        textAlign: "center",
        fontWeight: 500
      }}
    >
      {label}
    </span>
  </button>
);

/* ---------------- SIDEBAR ---------------- */

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const ITEMS = React.useMemo(() => {
    if (!isAdmin) return BASE_ITEMS;
    return [
      ...BASE_ITEMS,
      {
        label: "Admin",
        path: "/admin-dash",
        icon: <AdminIcon />
      }
    ];
  }, [isAdmin]);

  const go = (path) => {
    if (path === "/canva-clone")
      window.open(window.location.origin + path, "_blank");
    else navigate(path);
  };

  return (
    <aside
      style={{
        position: "fixed",
        left: 18,
        top: "54%",
        transform: "translateY(-50%)",
        width: 56,

        background: "rgba(255,255,255,0.28)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",

        border: "1px solid rgba(59,130,246,0.25)",
        borderRadius: 20,

        padding: "8px 0",

        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,

        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",

        zIndex: 9999
      }}
    >
      {ITEMS.map((item) => (
        <RailItem
          key={item.path}
          label={item.label}
          icon={item.icon}
          active={location.pathname === item.path}
          onClick={() => go(item.path)}
        />
      ))}
    </aside>
  );
};

export default SideBar;