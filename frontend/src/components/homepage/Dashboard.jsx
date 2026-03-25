import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import userService from "../../services/UserDash/User.service";


import {
  HiOutlinePresentationChartLine,
} from "react-icons/hi2";


import { FaRegImage } from "react-icons/fa";


import {
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiZap
} from "react-icons/fi";


import logo from "../../assets/logo.png";
import api from "../../services/api";


const TOOLS = [
  {
    name: "PPT",
    icon: HiOutlinePresentationChartLine,
    route: "/presentation",
    color: "bg-blue-600 text-white"
  },
  {
    name: "Image",
    icon: FaRegImage,
    route: "/canva-clone",
    color: "bg-yellow-400 text-black"
  },
  {
    name: "AI PPT",
    icon: HiOutlinePresentationChartLine,
    route: "/ai-presentation",
    color: "bg-blue-700 text-white"
  },
  {
    name: "AI Image",
    icon: FaRegImage,
    route: "/create/ai-design",
    color: "bg-yellow-300 text-black"
  },
];

const toolImages = [
  "https://i.pinimg.com/736x/96/52/26/965226daa2d2a6aab40d6458646f34f4.jpg",
  "https://i.pinimg.com/1200x/7e/d5/4e/7ed54e337f028c3cd32335c62ee95e0f.jpg",
  "https://i.pinimg.com/1200x/ee/df/40/eedf409776e505b5c1db7141dfff5317.jpg",
  "https://i.pinimg.com/736x/86/31/10/863110a064ad0313637ef77ec4004606.jpg",
  "https://i.pinimg.com/736x/70/d3/de/70d3dea50a707732f92d493961ad29b9.jpg",
  "https://i.pinimg.com/1200x/f2/5d/cd/f25dcd144cc08c007d3e64cdc91349f0.jpg"
];


export default function Dashboard() {
  const navigate = useNavigate();
  const scrollRef = React.useRef(null);

  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState("manual");
  const [tokens, setTokens] = useState(0);

  const templates = Array.from({ length: 24 }, (_, i) => i + 1);
  const perPage = 8;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -260, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 260, behavior: "smooth" });
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const profileData = await api.getProfile();
        if (mounted) setProfile(profileData || null);

        const walletRes = await userService.getWalletDashboard();
        const data = walletRes.data || walletRes;

        if (mounted) {
          setTokens(Number(data.totalBalance || 0) - Number(data.usedBalance || 0));
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    fetchData();

    return () => (mounted = false);
  }, []);

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      @keyframes borderTrace {
        0% { background-position: 0% 0%; }
        25% { background-position: 100% 0%; }
        50% { background-position: 100% 100%; }
        75% { background-position: 0% 100%; }
        100% { background-position: 0% 0%; }
      }

      .ai-tool-wrapper {
        position: relative;
        border-radius: 24px;
        padding: 2px;
        background: linear-gradient(
          90deg,
          #a8af1e,
          #f3f63b,
          #faf260,
          #e5e90e,
          #afaa1e
        );
        background-size: 300% 300%;
        animation: borderTrace 4s linear infinite;
        box-shadow:
          0 6px 0 rgba(235, 232, 37, 0.9),
          0 20px 25px -5px rgba(246, 234, 59, 0.35),
          0 10px 10px -5px rgba(227, 246, 59, 0.15);
        transition: transform .2s ease, box-shadow .2s ease;
      }

      .ai-tool-wrapper:hover {
        transform: translateY(-4px);
        box-shadow:
          0 20px 25px -5px rgba(230, 246, 59, 0.35),
          0 10px 10px -5px rgba(246, 221, 59, 0.15);
      }

      .ai-tool-inner {
        border-radius: 22px;
        background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
        display: flex;
        align-items: center;
        gap: 24px;
        position: relative;
        overflow: hidden;
      }

      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }

      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      @media (hover: none), (pointer: coarse), (max-width: 1024px) {
        .ai-tool-wrapper:hover {
          transform: none;
        }
      }
    `;

    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const fullName =
    profile?.firstName
      ? `${profile.firstName} ${profile.lastName || ""}`
      : profile?.email?.split("@")[0] || "User";

  const handleRenewPlan = () => {
    navigate("/pricing");
  };

  const visibleTemplates = templates.slice(page * perPage, page * perPage + perPage);

  const manualTools = [
    {
      icon: HiOutlinePresentationChartLine,
      title: "Presentation",
      route: "/presentation"
    },
    {
      icon: FaRegImage,
      title: "Image",
      route: "/canva-clone"
    }
  ];

  const aiTools = [
    {
      icon: HiOutlinePresentationChartLine,
      title: "AI PPT",
      route: "/ai-presentation"
    },
    {
      icon: FaRegImage,
      title: "AI Image",
      route: "/create/ai-design"
    }
  ];


  return (
    <div className="min-h-screen bg-[#e9f4ff]">
      <div className="relative ml-0 md:ml-[60px] lg:ml-[72px] pt-20 sm:pt-24 px-4 sm:px-6 lg:px-10 xl:px-14 pb-24 md:pb-0">
        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-2 mb-3 py-8 px-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 rounded-[28px] overflow-hidden"
        >
          <div className="absolute inset-0 rounded-[22px] sm:rounded-[28px] bg-gradient-to-r from-white via-sky-200 to-white opacity-70 pointer-events-none" />
          <div className="absolute inset-0 rounded-[22px] sm:rounded-[28px] border border-sky-200 pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[120px] sm:h-[150px] bg-gradient-to-b from-white to-transparent blur-xl pointer-events-none rounded-t-[22px] sm:rounded-t-[28px]" />

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 w-full">
            {/* LEFT */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0">
              <img
                src={logo}
                alt="logo"
                className="h-12 xs:h-13 sm:h-16 md:h-18 lg:h-20 w-auto max-w-[110px] sm:max-w-[130px] lg:max-w-[160px] object-contain drop-shadow-lg shrink-0"
              />

              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/65 backdrop-blur-md ring-1 ring-sky-200/60 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ready to create
                </div>

                <h1 className="mt-2 text-2xl sm:text-3xl lg:text-[34px] leading-tight font-extrabold text-slate-900 break-words">
                  Welcome,
                  <span className="ml-2 bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                    {fullName}
                  </span>
                </h1>

                <p className="text-sm sm:text-[15px] text-slate-600 mt-2 max-w-xl leading-6">
                  Create <span className="font-semibold text-slate-700">presentations</span>,{" "}
                  <span className="font-semibold text-slate-700">images</span> and{" "}
                  AI-powered templates in minutes.
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 xl:justify-end">
              <div>
                <p className="text-xs text-slate-500">Available Balance</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  ${Number(tokens || 0).toFixed(3)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Renew anytime to keep generating.
                </p>
              </div>

              <button
                onClick={handleRenewPlan}
                className="w-full sm:w-auto min-w-[120px] px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 text-sm sm:text-[15px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl sm:rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:shadow-xl active:scale-[0.98]"
              >
                Renew
              </button>
            </div>
          </div>
        </motion.div>


        {/* EXPLORE */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-8 sm:mt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900">Explore Tools</h2>

          <button
            onClick={() => setShowCreate(true)}
            className="w-full sm:w-auto min-w-[130px] flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-full bg-yellow-400 hover:bg-yellow-500 text-black text-sm sm:text-[15px] font-semibold shadow transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
          >
            <FiPlus className="text-[16px] sm:text-[18px]" />
            Create
          </button>
        </div>


        {/* TOOLS */}
        <div className="mt-3 relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-7 py-4">
            {TOOLS.map((tool, i) => {
              const colors = [
                "bg-blue-100",
                "bg-cyan-100",
                "bg-blue-200",
                "bg-yellow-100",
                "bg-blue-300",
                "bg-yellow-200"
              ];


              return (
                <motion.div
                  key={i}
                  onClick={() => navigate(tool.route)}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className={`group relative w-full h-[96px] sm:h-[100px] flex-shrink-0 rounded-2xl px-4 sm:px-5 py-4 cursor-pointer ${colors[i]}`}
                >
                  <p className="text-sm font-semibold text-gray-900">{tool.name}</p>


                  <img
                    src={toolImages[i]}
                    alt={tool.name}
                    className={`
                      absolute right-2 object-contain object-right
                      drop-shadow-[10px_8px_2px_rgba(0,0,0,0.35)]
                      transition-all duration-300 -rotate-3
                      ${i === 4 ? "bottom-[-6px] w-[102px] h-[84px] sm:w-[120px] sm:h-[95px]" : "bottom-[2px] w-[108px] h-[82px] sm:w-[125px] sm:h-[90px]"}
                      group-hover:-translate-y-2 group-hover:-rotate-1
                    `}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>


        {/* TEMPLATES */}
        <div className="mt-10 pb-20 sm:pb-24">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Ready Templates
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Pick a layout and start editing instantly.
              </p>
            </div>
          </div>


          <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
            {visibleTemplates.map((i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/70 shadow-[0_16px_40px_rgba(15,23,42,0.10)] overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={`https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&sig=${i}`}
                    alt={`Template ${i}`}
                    className="h-40 w-full object-cover"
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/10 via-transparent to-white/10 opacity-80" />
                </div>


                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm">Template {i}</h3>
                  <p className="text-xs text-slate-500 mt-1">Editable layout</p>
                </div>
              </motion.div>
            ))}
          </div>


          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8 sm:mt-10">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 rounded-xl flex items-center justify-center gap-2 bg-white/80 backdrop-blur-xl border border-white/70 text-slate-800 shadow-sm hover:shadow-md disabled:opacity-40 disabled:hover:shadow-sm"
            >
              <FiChevronLeft />
              Prev
            </button>


            <button
              disabled={(page + 1) * perPage >= templates.length}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-slate-900 shadow-sm disabled:opacity-50"
            >
              Next
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>


      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-5"
          >
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
             className="bg-white/85 backdrop-blur-xl rounded-[24px] sm:rounded-3xl shadow-[0_30px_80px_rgba(15,23,42,0.25)] w-full max-w-[560px] max-h-[90vh] overflow-y-auto p-5 sm:p-6 md:p-7 lg:p-8 relative border border-white/70"
            >
              <button
                onClick={() => setShowCreate(false)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-600 hover:text-slate-900 w-10 h-10 rounded-full bg-white/70 hover:bg-white flex items-center justify-center border border-white/60 shadow-sm"
              >
                <FiX size={22} />
              </button>

              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-5 sm:mb-6">
                Quick Start
              </h2>


              <div className="inline-flex bg-white/70 backdrop-blur-xl rounded-full p-1 w-fit mb-6 sm:mb-8 border border-white/70 shadow-sm">
                <button
                  onClick={() => setTab("manual")}
                  className={`px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition ${tab === "manual"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Manual
                </button>


                <button
                  onClick={() => setTab("ai")}
                  className={`px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition ${tab === "ai"
                    ? "bg-yellow-400 text-black shadow"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  AI
                </button>
              </div>


              {tab === "ai" ? (
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                 className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
                >
                  {aiTools.map((tool, i) => {
                    const Icon = tool.icon;
                    return (
                      <div className="ai-tool-wrapper" key={i}>
                        <motion.div
                          onClick={() => navigate(tool.route)}
                          className="cursor-pointer rounded-2xl border border-blue-100 shadow-sm transition flex flex-col items-center justify-center gap-3 h-[120px] sm:h-[130px] relative ai-tool-inner"
                        >
                          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                            <Icon size={22} />
                          </div>
                          <p className="font-semibold text-blue-900 text-sm">
                            {tool.title}
                          </p>
                          <span className="absolute top-3 right-3 text-yellow-500">
                            <FiZap size={16} />
                          </span>
                        </motion.div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
                >
                  {manualTools.map((tool, i) => {
                    const Icon = tool.icon;


                    return (
                      <motion.div
                        key={i}
                        whileHover={{ y: -5, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        onClick={() => navigate(tool.route)}
                        className="cursor-pointer rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50 shadow-[0_6px_18px_rgba(37,99,235,0.15)] hover:shadow-[0_12px_28px_rgba(37,99,235,0.25)] transition flex flex-col items-center justify-center gap-3 h-[120px] sm:h-[130px]"
                      >
                        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-100 text-blue-700 ring-2 ring-blue-200">
                          <Icon size={22} />
                        </div>


                        <p className="font-semibold text-blue-900 text-sm tracking-wide">
                          {tool.title}
                        </p>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
