import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { FiHelpCircle, FiSettings, FiBell } from "react-icons/fi";

const TopNavbar = () => {
    const navigate = useNavigate();
    const [openNotif, setOpenNotif] = useState(false);
    const notifRef = useRef(null);

    // close when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setOpenNotif(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 h-[52px] bg-[linear-gradient(135deg,#e0f2ff_0%,#eff6ff_40%,#ffffff_100%)] border-none shadow-[0_2px_10px_rgba(15,23,42,0.06)] flex items-center justify-between px-5 z-[100]">

            {/* LEFT */}
            <div className="flex items-center gap-3 text-slate-800 font-semibold text-[16px] tracking-wide">
                <div className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] flex items-center justify-center font-bold">
                    D
                </div>
                DesignovaAI
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2 relative">

                {/* HELP */}
                <button
                    onClick={() => navigate("/help-support")}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-sky-100 hover:text-sky-700 transition"
                >
                    <FiHelpCircle size={18} />
                </button>

                {/* SETTINGS */}
                <button
                    onClick={() => navigate("/settings")}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-sky-100 hover:text-sky-700 transition"
                >
                    <FiSettings size={18} />
                </button>

                {/* NOTIFICATION */}
                <div ref={notifRef}>
                    <button
                        onClick={() => setOpenNotif(!openNotif)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-sky-100 hover:text-sky-700 transition relative"
                    >
                        <FiBell size={18} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {openNotif && (
                        <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-3">
                            <p className="text-sm text-slate-600 mb-2">Notifications</p>

                            <div className="space-y-2 text-sm">
                                <div className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer text-slate-800">
                                    Your presentation is ready
                                </div>
                                <div className="p-2 rounded-lg hover:bg-sky-50 cursor-pointer text-slate-200">
                                    AI generated new design
                                </div>
                                <div className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer text-slate-200">
                                    File exported successfully
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* PROFILE */}
                <div
                    onClick={() => navigate("/profile")}
                    className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] flex items-center justify-center text-white text-sm font-semibold cursor-pointer"
                >
                    K
                </div>

            </div>
        </header>
    );
};

export default TopNavbar;