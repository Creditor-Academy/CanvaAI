import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { FiHelpCircle, FiSettings, FiBell } from "react-icons/fi";
import api from "../services/api";
import { FiLogOut, FiUser } from "react-icons/fi";

const TopNavbar = () => {
  const navigate = useNavigate();
  const [openNotif, setOpenNotif] = useState(false);
  const notifRef = useRef(null);

  const profileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [openProfile, setopenProfile] = useState(false);

  const [credits, setCredits] = useState({
    total: 100,
    used: 35,
  });

  /* -------------------- Close notification on outside click -------------------- */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setOpenNotif(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setopenProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* --------------------------- Fetch profile from API -------------------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getProfile();
        if (mounted) setProfile(data || null);
      } catch {}
    })();
    return () => (mounted = false);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 h-[52px] flex items-center justify-between px-5 z-[100]"
      style={{
        background: "#d0e9ff",
      }}
    >
      {/* LEFT LOGO */}
      <div className="flex items-center gap-3 text-[#54565a] font-semibold text-[16px] tracking-wide">
        <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] flex items-center justify-center font-bold">
          D
        </div>
        DesignovaAI
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex items-center gap-2 relative">
        {/* HELP */}
        <button
          onClick={() => navigate("/help-support")}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#54565a] hover:bg-[rgba(9,146,194,0.08)] transition"
        >
          <FiHelpCircle size={18} />
        </button>

        {/* NOTIFICATIONS */}
        <div ref={notifRef}>
          <button
            onClick={() => setOpenNotif(!openNotif)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#54565a] hover:bg-[rgba(9,146,194,0.08)] transition relative"
          >
            <FiBell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {openNotif && (
            <div
              className="absolute right-0 mt-3 w-72 rounded-xl shadow-2xl p-3"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.06)"
              }}
            >
              <p className="text-sm text-slate-600 mb-2">Notifications</p>

              <div className="space-y-2 text-sm">
                <div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-800">
                  Your presentation is ready
                </div>
                <div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-800">
                  AI generated new design
                </div>
                <div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-800">
                  File exported successfully
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setopenProfile(!openProfile)}
            className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] 
               flex items-center justify-center text-white text-sm font-semibold cursor-pointer overflow-hidden"
          >
            {profile?.avatar ? (
              <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span>
                {(profile?.firstName?.[0] || profile?.email?.[0] || "U").toUpperCase()}
                {(profile?.lastName?.[0] || profile?.email?.[1] || "").toUpperCase()}
              </span>
            )}
          </div>

          {openProfile && (
            <div
              className="absolute right-0 mt-3 w-72 rounded-2xl shadow-2xl overflow-hidden z-50"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.06)"
              }}
            >
              {/* PROFILE HEADER */}
              <div className="flex flex-col items-center px-5 pt-5 pb-4">

                <div className="w-16 h-16 rounded-full bg-[#60a5fa] text-white flex items-center justify-center text-xl font-semibold mb-3 overflow-hidden">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      {(profile?.firstName?.[0] || profile?.email?.[0] || "U").toUpperCase()}
                      {(profile?.lastName?.[0] || profile?.email?.[1] || "").toUpperCase()}
                    </>
                  )}
                </div>

                <div className="font-semibold text-slate-800 text-sm text-center">
                  {profile?.firstName
                    ? `${profile.firstName} ${profile.lastName || ""}`
                    : profile?.email?.split("@")[0]}
                </div>

                <div className="text-xs text-slate-500 text-center mt-1 break-all">
                  {profile?.email}
                </div>
              </div>

              {/* CREDITS */}
              <div className="mt-4 w-full px-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Total Credits</span>
                  <span>
                    {credits.used} / {credits.total}
                  </span>
                </div>
              </div>

              <div className="h-px bg-slate-200"></div>

              {/* ACTIONS */}
              <div className="py-2 text-sm">

                <button
                  onClick={() => {
                    navigate("/settings", { state: { profile } });
                    setopenProfile(false);
                  }}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-slate-100 text-slate-700"
                >
                  <FiUser size={16} />
                  Personal Settings
                </button>

                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    navigate("/login", { replace: true });
                  }}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-red-50 text-red-600"
                >
                  <FiLogOut size={16} />
                  Logout
                </button>

              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;