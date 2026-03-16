import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/* ---------- ICONS ---------- */

const HomeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5L12 3l9 7.5"></path>
    <path d="M5 10v10h5v-6h4v6h5V10"></path>
  </svg>
);

const PPTIcon = ({ size = 20, active }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "white" : "black"}
    strokeWidth="1.176"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4.99787498 9 L4.99787498 1 L19.5 1 L23 4.5 L23 23 L4 23" />
    <path d="M18 1 L18 6 L23 6" />
    <path d="M4 12 L4.25 12 L5.5 12 C7.5 12 9 12.5 9 14.25 C9 16 7.5 16.5 5.5 16.5 L4.25 16.5 L4.25 19 L4 19 L4 12 Z" />
  </svg>
);


const EditorIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M4 20h4l10-10a2.5 2.5 0 10-4-4L4 16v4z"></path>
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
      gap: 4,
      padding: "6px 0",
      cursor: "pointer",
      color: active ? "#1e40af" : "#4b5563"
    }}
  >
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active
          ? "rgba(59,130,246,0.9)"
          : "rgba(255,255,255,0.5)",
        color: active ? "#fff" : "#374151",
        backdropFilter: "blur(6px)"
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

  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);

  React.useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth;

      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
    };

    checkScreen(); // run on load
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

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
    navigate(path);
  };

  return (
    <aside
  style={{
    position: "fixed",

    left: isMobile ? "50%" : 18,
    top: isMobile ? "auto" : "55%",
    bottom: isMobile ? 14 : "auto",

    transform: isMobile ? "translateX(-50%)" : "translateY(-50%)",

    width: isMobile ? "92%" : 56,

    height: isTablet ? "55vh" : "auto",

    background: "rgba(255,255,255,0.28)",
    backdropFilter: "blur(14px)",

    border: "1px solid rgba(59,130,246,0.25)",
    borderRadius: 20,

    padding: isMobile ? "8px 10px" : isTablet ? "18px 0" : "8px 0",

    display: "flex",
    flexDirection: isMobile ? "row" : "column",

    alignItems: "center",

    justifyContent: isMobile
      ? "space-around"
      : isTablet
      ? "space-between"
      : "center",

    gap: isTablet ? 12 : 6,

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