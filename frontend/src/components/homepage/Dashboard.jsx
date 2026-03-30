import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import userService from "../../services/UserDash/User.service";
import { getAdminTemplates, getPublicTemplateById } from "../../services/presentation";
import { getPublicTemplateImages, saveImage } from "../../services/imageEditor/imageApi";
import { useAuth } from "../../contexts/AuthContext";
import TemplatePreviewModal from "../presentation3/TemplatePreviewModal";
import ImagePopup from "../canva/ImageLayout/imagePopup";
import { ImageThumbPreview } from "../canva/ImageLayout/ImageLayout";
import PresentationThumbnail from "../PresentationThumbnail";
import { toast } from "sonner";


import {
  HiOutlinePresentationChartLine,
} from "react-icons/hi2";


import { FaRegImage } from "react-icons/fa";


import {
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiZap,
  FiLayout
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


// Lazy-loaded template card — renders content only when it enters the viewport
function LazyCard({ children, className = "", style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "120px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={style}>
      {visible ? children : <div className="dash-skeleton" />}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const scrollRef = React.useRef(null);
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState("manual");
  const [tokens, setTokens] = useState(0);

  // Template states
  const [pptTemplates, setPptTemplates] = useState([]);
  const [imgTemplates, setImgTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateTab, setTemplateTab] = useState("all");
  const [templatePage, setTemplatePage] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

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
      // Profile
      try {
        const profileData = await api.getProfile();
        if (mounted) setProfile(profileData || null);
      } catch (e) {
        console.error("Profile fetch error:", e);
      }

      // Wallet
      try {
        const walletRes = await userService.getWalletDashboard();
        const data = walletRes.data || walletRes;
        if (mounted) setTokens(Number(data.totalBalance || 0) - Number(data.usedBalance || 0));
      } catch (e) {
        console.error("Wallet fetch error:", e);
      }

      // Templates — independent of profile/wallet
      if (mounted) setTemplatesLoading(true);
      try {
        const [pptRes, imgRes] = await Promise.all([
          getAdminTemplates(),
          getPublicTemplateImages(),
        ]);
        if (mounted) {
          setTemplatesLoading(false);
          setPptTemplates(Array.isArray(pptRes?.data) ? pptRes.data : Array.isArray(pptRes) ? pptRes : []);
          setImgTemplates(Array.isArray(imgRes?.data) ? imgRes.data : Array.isArray(imgRes) ? imgRes : []);
        }
      } catch (e) {
        console.error("Templates fetch error:", e);
        if (mounted) setTemplatesLoading(false);
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

      @keyframes viewBtnPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(10,93,187,0.4); }
        50%       { box-shadow: 0 0 0 6px rgba(10,93,187,0); }
      }
      @keyframes dashSkeletonShimmer {
        0%   { background-position: -400px 0; }
        100% { background-position: 400px 0; }
      }
      .dash-skeleton {
        width: 100%;
        height: 100%;
        min-height: 160px;
        border-radius: 16px;
        background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
        background-size: 800px 100%;
        animation: dashSkeletonShimmer 1.4s infinite linear;
      }
      .dash-view-btn {
        padding: 5px 13px;
        border-radius: 8px;
        border: 1.5px solid #0a5dbb;
        background: transparent;
        color: #0a5dbb;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        flex-shrink: 0;
        position: relative;
        overflow: hidden;
        transition: color 0.22s, background 0.22s, border-color 0.22s, box-shadow 0.22s, transform 0.15s;
        letter-spacing: 0.01em;
      }
      .dash-view-btn:hover {
        background: linear-gradient(135deg, #0a5dbb 0%, #1d7bff 100%);
        border-color: transparent;
        color: #fff;
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(10,93,187,0.35), 0 1px 4px rgba(10,93,187,0.2);
      }
      .dash-view-btn:active {
        transform: translateY(0px) scale(0.97);
        box-shadow: 0 2px 6px rgba(10,93,187,0.3);
        animation: viewBtnPulse 0.4s ease-out;
      }
      .dash-tab-pill {
        display: inline-flex;
        background: rgba(255,255,255,0.75);
        backdrop-filter: blur(10px);
        border-radius: 999px;
        padding: 3px;
        gap: 2px;
        border: 1px solid rgba(99,102,241,0.18);
        box-shadow: 0 2px 10px rgba(99,102,241,0.1);
      }
      .dash-tab-btn {
        padding: 5px 14px;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        border: none;
        background: transparent;
        color: #64748b;
        transition: color 0.18s, background 0.18s, box-shadow 0.18s;
      }
      .dash-tab-btn.active {
        background: #facc15;
        color: #fff;
        box-shadow: 0 2px 8px rgba(99,102,241,0.35);
      }
      .dash-tab-btn:not(.active):hover {
        background: rgba(99,102,241,0.08);
        color: #312e81;
      }
      .dash-tpl-card {
        border-radius: 16px;
      }
      .dash-tpl-inner {
        transition: border-color 0.18s, box-shadow 0.18s;
      }
      .dash-tpl-inner:hover {
        border-color: #6366f1;
        box-shadow: 0 4px 16px rgba(99,102,241,0.12);
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

  // Template helpers
  const getSlideData = (item) => {
    if (!item?.data) return null;
    let data = item.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { return null; }
    }
    return data.slides?.[0] || (data.layers ? data : null);
  };

  const handleViewPPT = async (tpl) => {
    const tplId = tpl._id || tpl.id;
    try {
      const data = await getPublicTemplateById(tplId);
      setPreviewData(data.data || data);
      setSelectedTemplateId(tplId);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error("Error fetching template preview:", err);
      alert("Failed to load template preview.");
    }
  };

  const handleImportImage = async (image) => {
    try {
      const userId = user?._id || user?.id;
      const resp = await saveImage({
        userId,
        title: (image.title || 'Untitled Template') + '_copy',
        data: image.data,
      });
      const newId = resp?.imageId || resp?.data?._id || resp?._id;
      if (newId) {
        try {
          sessionStorage.setItem(`prefill_project_${newId}`, JSON.stringify({
            title: (image.title || 'Untitled Template') + '_copy',
            data: image.data,
          }));
          sessionStorage.setItem(`prefill_import_flag_${newId}`, '1');
        } catch (e) {}
        window.open(`/canva-clone/${newId}`, '_blank');
      }
      toast.success('Template imported to your account');
    } catch (err) {
      console.error('Import failed', err);
      toast.error('Failed to import template');
    }
  };

  const perPage = 12;

  const combinedTemplates = React.useMemo(() => {
    if (templateTab === "ppt") {
      return pptTemplates.map(t => ({ ...t, _type: 'ppt' }));
    }
    if (templateTab === "images") {
      return imgTemplates.map(t => ({ ...t, _type: 'image' }));
    }
    // "all" — interleave randomly using Fisher-Yates shuffle
    const merged = [
      ...pptTemplates.map(t => ({ ...t, _type: 'ppt' })),
      ...imgTemplates.map(t => ({ ...t, _type: 'image' })),
    ];
    for (let i = merged.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [merged[i], merged[j]] = [merged[j], merged[i]];
    }
    return merged;
  }, [pptTemplates, imgTemplates, templateTab]);

  const totalTemplatePages = Math.ceil(combinedTemplates.length / perPage);
  const visibleTemplates = combinedTemplates.slice(templatePage * perPage, (templatePage + 1) * perPage);

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
          <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Ready Templates
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Pick a layout and start editing instantly.
              </p>
            </div>
            {/* Slider-switch tab */}
            <div className="dash-tab-pill">
              <button
                className={`dash-tab-btn${templateTab === "all" ? " active" : ""}`}
                onClick={() => { setTemplateTab("all"); setTemplatePage(0); }}
              >All</button>
              <button
                className={`dash-tab-btn${templateTab === "ppt" ? " active" : ""}`}
                onClick={() => { setTemplateTab("ppt"); setTemplatePage(0); }}
              >PPT</button>
              <button
                className={`dash-tab-btn${templateTab === "images" ? " active" : ""}`}
                onClick={() => { setTemplateTab("images"); setTemplatePage(0); }}
              >Images</button>
            </div>
          </div>

          {templatesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="dash-skeleton" style={{ minHeight: 180, borderRadius: 16 }} />
              ))}
            </div>
          ) : visibleTemplates.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">No templates available yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
              {visibleTemplates.map((tpl) => {
                const isPPT = tpl._type === 'ppt';
                const slideData = isPPT ? getSlideData(tpl) : null;
                return (
                  <LazyCard
                    key={`${tpl._type}-${tpl._id || tpl.id}`}
                    className="dash-tpl-card"
                  >
                    <div
                      onClick={() => isPPT ? handleViewPPT(tpl) : setSelectedImage(tpl)}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden cursor-pointer dash-tpl-inner"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-36 bg-[#eef2ff] flex items-center justify-center overflow-hidden">
                        {isPPT ? (
                          slideData
                            ? <PresentationThumbnail slide={slideData} width="100%" height="100%" />
                            : <FiLayout size={36} color="#6366f1" />
                        ) : (
                          <div
                            className="absolute inset-0"
                            ref={el => {
                              if (!el) return;
                              const cs = tpl.data?.canvasSize || { width: 800, height: 600 };
                              const setScale = () => {
                                const w = el.offsetWidth || el.clientWidth;
                                const h = el.offsetHeight || el.clientHeight;
                                if (!w || !h) return;
                                el.style.setProperty('--thumb-scale', String(Math.min(w / (cs.width || 800), h / (cs.height || 600))));
                              };
                              setScale();
                              const ro = new ResizeObserver(() => { setScale(); ro.disconnect(); });
                              ro.observe(el);
                            }}
                          >
                            <ImageThumbPreview image={tpl} />
                          </div>
                        )}
                        {/* Type indicator badge */}
                        <div style={{
                          position: 'absolute', top: 8, left: 8,
                          background: isPPT ? 'rgba(37,99,235,0.12)' : 'rgba(99,102,241,0.12)',
                          borderRadius: 8, padding: '4px 7px',
                          display: 'flex', alignItems: 'center', gap: 5,
                          backdropFilter: 'blur(6px)',
                          border: `1px solid ${isPPT ? 'rgba(37,99,235,0.18)' : 'rgba(99,102,241,0.18)'}`,
                        }}>
                          {isPPT ? (
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4.99787498 9 L4.99787498 1 L19.5 1 L23 4.5 L23 23 L4 23" />
                              <path d="M18 1 L18 6 L23 6" />
                              <path d="M4 12 L4.25 12 L5.5 12 C7.5 12 9 12.5 9 14.25 C9 16 7.5 16.5 5.5 16.5 L4.25 16.5 L4.25 19 L4 19 L4 12 Z" />
                            </svg>
                          ) : (
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.7">
                              <rect x="3" y="3" width="18" height="18" rx="3" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5-4 4-3-3-6 6" />
                            </svg>
                          )}
                          <span style={{ fontSize: 10, fontWeight: 700, color: isPPT ? '#2563eb' : '#6366f1', letterSpacing: '0.02em' }}>
                            {isPPT ? 'PPT' : 'Image'}
                          </span>
                        </div>
                      </div>
                      {/* Card info */}
                      <div className="p-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 text-sm truncate">
                            {tpl.title || 'Untitled Template'}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {isPPT ? 'Presentation' : 'Image'} template
                          </p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); isPPT ? handleViewPPT(tpl) : setSelectedImage(tpl); }}
                          className="dash-view-btn"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </LazyCard>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8 sm:mt-10">
            <button
              disabled={templatePage === 0}
              onClick={() => setTemplatePage(p => p - 1)}
              className="px-4 py-2 rounded-xl flex items-center justify-center gap-2 bg-white/80 backdrop-blur-xl border border-white/70 text-slate-800 shadow-sm hover:shadow-md disabled:opacity-40 disabled:hover:shadow-sm"
            >
              <FiChevronLeft />
              Prev
            </button>
            <button
              disabled={templatePage >= totalTemplatePages - 1}
              onClick={() => setTemplatePage(p => p + 1)}
              className="px-4 py-2 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-slate-900 shadow-sm disabled:opacity-50"
            >
              Next
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>


      {/* PPT TEMPLATE PREVIEW MODAL */}
      <TemplatePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        templateData={previewData}
        onImport={() => {
          setIsPreviewOpen(false);
          if (selectedTemplateId) {
            window.open(`/presentation-editor-v3/${selectedTemplateId}?template=true`, '_blank');
          }
        }}
      />

      {/* IMAGE POPUP */}
      {selectedImage && (
        <ImagePopup
          image={selectedImage}
          thumbnail={null}
          onClose={() => setSelectedImage(null)}
          onImport={handleImportImage}
        />
      )}

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
