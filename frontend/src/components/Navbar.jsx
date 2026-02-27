import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { FiHelpCircle, FiSettings, FiBell } from "react-icons/fi";
import api from "../services/api";
// add at top
import { FiLogOut, FiUser } from "react-icons/fi";

// Top navbar with profile hover preview (same data as sidebar)

const TopNavbar = () => {
  const navigate = useNavigate();
  const [openNotif, setOpenNotif] = useState(false);
  const notifRef = useRef(null);

  const profileRef = useRef(null);

  // profile states
  const [profile, setProfile] = useState(null);
  const [openProfile, setopenProfile] = useState(false);

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
      } catch { }
    })();
    return () => (mounted = false);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-[52px] bg-[linear-gradient(135deg,#e0f2ff_0%,#eff6ff_40%,#ffffff_100%)] shadow-[0_2px_10px_rgba(15,23,42,0.06)] flex items-center justify-between px-5 z-[100]">
      {/* LEFT LOGO */}
      <div className="flex items-center gap-3 text-slate-800 font-semibold text-[16px] tracking-wide">
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
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-sky-100 hover:text-sky-700 transition"
        >
          <FiHelpCircle size={18} />
        </button>



        {/* NOTIFICATIONS */}
        <div ref={notifRef}>
          <button
            onClick={() => setOpenNotif(!openNotif)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-sky-100 hover:text-sky-700 transition relative"
          >
            <FiBell size={18} />
            {!openNotif && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {openNotif && (
            <div className="absolute right-0 mt-3 w-[340px] bg-white/95 backdrop-blur-xl border border-slate-200/70 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.15)] overflow-hidden z-50">

              {/* HEADER */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70">
                <p className="text-sm font-semibold text-slate-800">Notifications</p>
                <span className="text-xs text-sky-600 font-medium cursor-pointer hover:underline">
                  Mark all as read
                </span>
              </div>

              {/* LIST */}
              <div className="max-h-[320px] overflow-y-auto">

                {/* ITEM */}
                <div className="group flex gap-3 px-4 py-3 hover:bg-sky-50/70 cursor-pointer transition">
                  <div className="mt-1 w-2 h-2 rounded-full bg-sky-500"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800 font-medium">
                      Your presentation is ready
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">2 minutes ago</p>
                  </div>
                </div>

                <div className="group flex gap-3 px-4 py-3 hover:bg-sky-50/70 cursor-pointer transition">
                  <div className="mt-1 w-2 h-2 rounded-full bg-sky-500"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800 font-medium">
                      AI generated a new design draft
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">10 minutes ago</p>
                  </div>
                </div>

                <div className="group flex gap-3 px-4 py-3 hover:bg-sky-50/70 cursor-pointer transition">
                  <div className="mt-1 w-2 h-2 rounded-full bg-sky-500"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800 font-medium">
                      File exported successfully
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">1 hour ago</p>
                  </div>
                </div>

              </div>

              {/* FOOTER */}
              <div className="border-t border-slate-200/70 px-4 py-2 text-center">
                <button className="text-xs font-medium text-sky-600 hover:underline">
                  View all notifications
                </button>
              </div>

            </div>
          )}
        </div>

        {/* PROFILE AVATAR */}
        {/* PROFILE AVATAR */}
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

          {/* CLICK DROPDOWN */}


          {openProfile && (
            <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50">

              {/* PROFILE HEADER */}
              <div className="flex flex-col items-center px-5 pt-5 pb-4">

                {/* BIG AVATAR */}
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

                {/* NAME */}
                <div className="font-semibold text-slate-800 text-sm text-center">
                  {profile?.firstName
                    ? `${profile.firstName} ${profile.lastName || ""}`
                    : profile?.email?.split("@")[0]}
                </div>

                {/* EMAIL */}
                <div className="text-xs text-slate-500 text-center mt-1 break-all">
                  {profile?.email}
                </div>
              </div>

              {/* DIVIDER */}
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
