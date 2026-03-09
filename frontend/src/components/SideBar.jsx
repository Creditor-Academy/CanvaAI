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
  { label: "Home", path: "/home", icon: <FiGrid size={22} /> },
  { label: "Files", path: "/projects", icon: <FiFolder size={22} /> },
  { label: "PPT", path: "/presentation", icon: <FiLayout size={22} /> },
  { label: "Editor", path: "/editor", icon: <FiFileText size={22} /> },
  { label: "Image", path: "/create-image", icon: <FiImage size={22} /> },
  { label: "Analytics", path: "/analytics", icon: <FiActivity size={22} /> }
];

/* ---------------- RAIL ITEM ---------------- */

const RailItem = ({ active, label, icon, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: 63,
      border: "none",
      background: "transparent",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      padding: "6px 0",
      cursor: "pointer",
      color: active ? "#000000" : "#54565a",
      transition: "all .18s ease",
    }}
  >
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "#4988C4" : "transparent",
        transition: "all .18s ease",
      }}
    >
      {icon}
    </div>

    <span style={{ fontSize: 11, textAlign: "center" }}>
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
        icon: <FiShield size={22} />
      }
    ];
  }, [isAdmin]);

  const go = (path) => {
    if (path === "/canva-clone")
      window.open(window.location.origin + path, "_blank");
    else
      navigate(path);
  };

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 52,
        height: "calc(100vh - 52px)",
        width: 63,
        background: "rgba(193, 221, 245)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRight: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "4px 0 20px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        zIndex: 99,
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