import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { FiHelpCircle, FiBell, FiLogOut, FiUser } from "react-icons/fi";
import logo from "../assets/logo.png";
import { FiMenu } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";



const TopNavbar = () => {
  const navigate = useNavigate();
  const { user: profile, logout } = useAuth();
  const [openNotif, setOpenNotif] = useState(false);
  const notifRef = useRef(null);


  const profileRef = useRef(null);
  const [openProfile, setopenProfile] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  /* ---------------- Close profile outside click ---------------- */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setopenProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------------- Close mobile menu outside click ---------------- */
  useEffect(() => {
    const handler = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(e.target)
      )
        setOpenMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);




  return (
    <header
      className="flex items-center justify-between px-4 md:px-6"
      style={{
        height: 62,
      }}
    >
      {/* LEFT LOGO */}


      <div className="flex items-center gap-2">
        <img
          src={logo}
          alt="Designova Logo"
          className="h-12 md:h-16 object-contain cursor-pointer"
        />
        <div className="flex items-center  text-slate-700 font-semibold text-[16px] tracking-wide">Designova</div>


      </div>


      {/* RIGHT ACTIONS */}


      <div className="flex items-center gap-2 relative">

        {/* PROFILE (desktop only) */}
        <div className="hidden md:block relative" ref={profileRef}>
          <div
            onClick={() => setopenProfile(!openProfile)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer overflow-hidden select-none"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d9ad8 100%)", boxShadow: "0 2px 8px rgba(59,130,246,0.35)" }}
          >
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[15px] leading-none">
                {(profile?.firstName?.[0] || profile?.email?.[0] || "U").toUpperCase()}
              </span>
            )}
          </div>


          {openProfile && (
            <div
              className="absolute right-0 mt-3 w-72 rounded-2xl shadow-2xl overflow-hidden z-50"
              style={{
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {/* Profile header — horizontal row like the screenshot */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
                <div
                  className="w-10 h-10 rounded-xl shrink-0 text-white flex items-center justify-center text-base font-bold overflow-hidden select-none"
                  style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", boxShadow: "0 2px 8px rgba(59,130,246,0.35)" }}
                >
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    (profile?.firstName?.[0] || profile?.email?.[0] || "U").toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 text-sm truncate">
                    {profile?.firstName
                      ? `${profile.firstName} ${profile.lastName || ""}`
                      : profile?.email?.split("@")[0]}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">
                    {profile?.email}
                  </div>
                </div>
              </div>

              <div className="py-1.5 text-sm">
                <button
                  onClick={() => {
                    navigate("/dashboard/settings", { state: { profile } });
                    setopenProfile(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-slate-700"
                >
                  <FiUser size={16} />
                  Personal Settings
                </button>

                <button
                  onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 text-red-500"
                >
                  <FiLogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


      {openMenu && (
        <div
          className="absolute top-[70px] right-4 w-64 rounded-xl shadow-xl p-4 md:hidden"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >


          {/* PROFILE INFO */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-base font-bold overflow-hidden select-none shrink-0"
              style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", boxShadow: "0 2px 8px rgba(59,130,246,0.35)" }}
            >
              {profile?.avatar ? (
                <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                (profile?.firstName?.[0] || profile?.email?.[0] || "U").toUpperCase()
              )}
            </div>


            <div className="text-sm min-w-0">
              <div className="font-semibold truncate">
                {profile?.firstName
                  ? `${profile.firstName} ${profile.lastName || ""}`
                  : profile?.email?.split("@")[0]}
              </div>
              <div className="text-xs text-slate-500 truncate">{profile?.email}</div>
            </div>
          </div>


          {/* MENU ITEMS */}


          <button
            onClick={() => {
              navigate("/dashboard/help-support");
              setOpenMenu(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            <FiHelpCircle size={18} />
            Help & Support
          </button>


          <button
            onClick={() => navigate("/dashboard/settings", { state: { profile } })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            <FiUser size={18} />
            Personal Settings
          </button>


          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600"
          >
            <FiLogOut size={18} />
            Logout
          </button>


        </div>
      )}
    </header>
  );
};


export default TopNavbar;