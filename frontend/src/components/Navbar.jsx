import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { FiHelpCircle, FiBell, FiLogOut, FiUser } from "react-icons/fi";
import api from "../services/api";
import logo from "../assets/logo.png";
import { FiMenu } from "react-icons/fi";
import userService from "../services/UserDash/User.service";


const TopNavbar = () => {
  const navigate = useNavigate();
  const [openNotif, setOpenNotif] = useState(false);
  const notifRef = useRef(null);


  const profileRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [openProfile, setopenProfile] = useState(false);
  const [wallet, setWallet] = useState({
    totalTokens: 0,
    remainingTokens: 0
  });


  const [openMenu, setOpenMenu] = useState(false);


  /* ---------------- Close notification outside click ---------------- */


  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setOpenNotif(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);


  /* ---------------- Close profile outside click ---------------- */


  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setopenProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);


  /* ---------------- Fetch profile ---------------- */


  useEffect(() => {
    let mounted = true;


    const fetchData = async () => {
      try {
        const profileData = await api.getProfile();
        if (mounted) setProfile(profileData || null);


        const walletRes = await userService.getWalletDashboard();
        const data = walletRes.data;


        if (mounted) {
          setWallet({
            totalTokens: data.totalTokens,
            remainingTokens: data.remainingTokens
          });
        }


      } catch (err) {
        console.error("Navbar fetch error:", err);
      }
    };


    fetchData();


    return () => (mounted = false);
  }, []);


  return (
    <header
      className="fixed z-[100] flex items-center justify-between px-4 md:px-6"
      style={{
        top: 12,
        left: 20,
        right: 20,
        height: 62,


        /* GLASS BACKGROUND */
        background: "rgba(255,255,255,0.35)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",


        /* BORDER */
        border: "1px solid rgba(59,130,246,0.2)",


        borderRadius: 16,


        /* FLOAT SHADOW */
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
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


        {/* HELP */}
        <button
          onClick={() => navigate("/help-support")}
          className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-slate-600 hover:bg-yellow-100 transition"
        >
          <FiHelpCircle size={18} />
        </button>


        {/* NOTIFICATIONS */}
        {/* <div ref={notifRef} className="relative">
          <button
            onClick={() => setOpenNotif(!openNotif)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-yellow-100 transition relative"
          >
            <FiBell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>


          {openNotif && (
            <div
              className="absolute right-0 mt-3 w-72 rounded-xl shadow-xl p-3"
              style={{
                background: "rgba(255,255,255)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <p className="text-sm text-slate-600 mb-2">Notifications</p>


              <div className="space-y-2 text-sm">
                <div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                  Your presentation is ready
                </div>


                <div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                  AI generated new design
                </div>


                <div className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                  File exported successfully
                </div>
              </div>
            </div>
          )}
        </div> */}


        {/* PROFILE (desktop only) */}
        <div className="hidden md:block relative" ref={profileRef}>
          <div
            onClick={() => setopenProfile(!openProfile)}
            className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] flex items-center justify-center text-white text-sm font-semibold cursor-pointer overflow-hidden"
          >
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt="avatar"
                className="w-full h-full object-cover"
              />
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
                background: "rgba(255,255,255)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex flex-col items-center px-5 pt-5 pb-4">
                <div className="w-16 h-16 rounded-full bg-blue-400 text-white flex items-center justify-center text-xl font-semibold mb-3 overflow-hidden">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      {(profile?.firstName?.[0] || profile?.email?.[0] || "U").toUpperCase()}
                      {(profile?.lastName?.[0] || profile?.email?.[1] || "").toUpperCase()}
                    </>
                  )}
                </div>


                <div className="font-semibold text-slate-800 text-sm text-center">
                  {
                    profile?.firstName
                      ? `${profile.firstName} ${profile.lastName || ""}`
                      : profile?.email?.split("@")[0]
                  }
                </div>


                <div className="text-xs text-slate-500 text-center mt-1 break-all">
                  {profile?.email}
                </div>
              </div>


              {/* credits */}


              <div className="px-4 pb-2 text-xs text-slate-500 flex justify-between">
                <span>Tokens</span>
                <span>
                  {Number(wallet.remainingTokens || 0).toFixed(3)} /{" "}
                  {Number(wallet.totalTokens || 0).toFixed(3)}
                </span>
              </div>


              <div className="h-px bg-slate-200"></div>


              {/* actions */}


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
        <button
          onClick={() => setOpenMenu(!openMenu)}
          className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-700 hover:bg-yellow-100"
        >
          <FiMenu size={20} />
        </button>
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
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
              {(profile?.firstName?.[0] || profile?.email?.[0] || "U").toUpperCase()}
            </div>


            <div className="text-sm">
              <div className="font-semibold">
                {profile?.firstName
                  ? `${profile.firstName} ${profile.lastName || ""}`
                  : profile?.email?.split("@")[0]}
              </div>
              <div className="text-xs text-slate-500">{profile?.email}</div>
            </div>
          </div>


          {/* MENU ITEMS */}


          <button
            onClick={() => {
              navigate("/help-support");
              setOpenMenu(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            <FiHelpCircle size={18} />
            Help & Support
          </button>


          <button
            onClick={() => navigate("/settings", { state: { profile } })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            <FiUser size={18} />
            Personal Settings
          </button>


          <button
            onClick={() => {
              localStorage.removeItem("token");
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
