import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiFolder,
  FiFileText,
  FiLayout,
  FiActivity,
  FiShield,
  FiImage
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";

/* ---------------- NAV ITEMS ---------------- */

const BASE_ITEMS = [
  { label: "Home", path: "/home", icon: <FiGrid size={20} /> },
  { label: "PPT", path: "/presentation", icon: <FiLayout size={20} /> },
  { label: "Editor", path: "/editor", icon: <FiFileText size={20} /> },
  { label: "Image", path: "/canva-clone", icon: <FiImage size={20} /> },
  { label: "Files", path: "/projects", icon: <FiFolder size={20} /> },
  { label: "Analytics", path: "/analytics", icon: <FiActivity size={20} /> }
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

        /* ACTIVE BLUE */
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
        icon: <FiShield size={20} />
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

        /* slightly lower center */
        top: "54%",
        transform: "translateY(-50%)",

        width: 56,

        /* GLASS BACKGROUND (white 10%) */
        background: "rgba(255,255,255,0.28)",

        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",

        /* BLUE BORDER (60%) */
        border: "1px solid rgba(59,130,246,0.25)",

        /* rounded top bottom */
        borderRadius: 20,

        padding: "8px 0",

        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,

        /* soft floating shadow */
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