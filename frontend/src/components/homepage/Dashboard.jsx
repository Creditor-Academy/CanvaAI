import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import userService from "../../services/UserDash/User.service";

import {
  HiOutlinePresentationChartLine,
  HiOutlineDocumentText
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
    name: "Doc",
    icon: HiOutlineDocumentText,
    route: "/editor",
    color: "bg-blue-500 text-white"
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
  {
    name: "AI Doc",
    icon: HiOutlineDocumentText,
    route: "/create/content-writer",
    color: "bg-blue-800 text-white"
  }
];
const toolImages = [
  "https://i.pinimg.com/736x/96/52/26/965226daa2d2a6aab40d6458646f34f4.jpg",
  "https://i.pinimg.com/1200x/7e/d5/4e/7ed54e337f028c3cd32335c62ee95e0f.jpg",
  "https://i.pinimg.com/1200x/ee/df/40/eedf409776e505b5c1db7141dfff5317.jpg",
  "https://images.pexels.com/photos/6476783/pexels-photo-6476783.jpeg",
  "https://i.pinimg.com/736x/70/d3/de/70d3dea50a707732f92d493961ad29b9.jpg",
  "https://i.pinimg.com/1200x/f2/5d/cd/f25dcd144cc08c007d3e64cdc91349f0.jpg"
];




export default function Dashboard() {

  const navigate = useNavigate();
  const [scrollX, setScrollX] = useState(0);
  const scrollRef = React.useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState("manual");

  const templates = Array.from({ length: 24 }, (_, i) => i + 1);
  const perPage = 8;

  useEffect(() => {

    let mounted = true;

    const fetchData = async () => {
      try {

        const profileData = await api.getProfile();
        if (mounted) setProfile(profileData || null);

        const walletRes = await userService.getWalletDashboard();

        const data = walletRes.data;

       if (mounted) setTokens(data.usedBalance);

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    fetchData();

    return () => mounted = false;

  }, []);

  const fullName =
    profile?.firstName
      ? `${profile.firstName} ${profile.lastName || ""}`
      : profile?.email?.split("@")[0] || "User";

  const [tokens, setTokens] = useState(0);

  const visibleTemplates = templates.slice(
    page * perPage,
    page * perPage + perPage
  );

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
    },
    {
      icon: HiOutlineDocumentText,
      title: "Document",
      route: "/editor"
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
    },
    {
      icon: HiOutlineDocumentText,
      title: "AI Doc",
      route: "/create/content-writer"
    }
  ];
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

.ai-tool-wrapper:hover{
 transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(230, 246, 59, 0.35), 0 10px 10px -5px rgba(246, 221, 59, 0.15);
}

.ai-tool-inner{
  border-radius: 22px;
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
  overflow: hidden;
}
  `;

    document.head.appendChild(style);

    return () => document.head.removeChild(style);
  }, []);

  return (

    <div className="bg-[#eef4ff] min-h-screen">

      <div className="ml-[60px] pt-24 px-14">

        {/* HERO */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#0f3c68] to-[#1e5aa5] rounded-3xl p-12 shadow-xl flex justify-between items-center"
        >

          <div className="flex items-center ">

            <img src={logo} className="h-26" />

            <div>

              <h1 className="text-3xl font-bold text-white">
                Welcome, {fullName} 👋
              </h1>

              <p className="text-blue-200">
                Create presentations, images and documents using AI
              </p>

            </div>

          </div>

          <div className="bg-white px-6 py-4 rounded-xl shadow flex items-center gap-6">

            <div>

              <p className="text-xs text-gray-500">
                Available Tokens
              </p>

              <p className="text-2xl font-bold text-blue-800">
                 ${Number(tokens || 0).toFixed(3)}
              </p>

            </div>

            <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2 rounded-lg font-semibold">
              Renew
            </button>

          </div>

        </motion.div>

        {/* EXPLORE */}

        <div className="flex justify-between items-center mt-16">

          <h2 className="text-2xl font-bold text-blue-900">
            Explore Tools
          </h2>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2 rounded-full font-semibold shadow"
          >
            <FiPlus />
            Create
          </button>

        </div>

        {/* TOOLS */}
        <div className="mt-10 relative">

          {/* LEFT ARROW */}

          <button
            onClick={scrollLeft}
            className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full w-11 h-11 flex items-center justify-center"
          >
            <FiChevronLeft />
          </button>

          {/* CAROUSEL */}

          <div className="overflow-hidden">

            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scroll-smooth hide-scrollbar"
              style={{ scrollBehavior: "smooth" }}
            >

              {TOOLS.map((tool, i) => {

                const colors = [
                  "bg-blue-100",
                  "bg-cyan-100",
                  "bg-blue-200",
                  "bg-yellow-100",
                  "bg-blue-300",
                  "bg-yellow-200"
                ]

                return (

                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.04 }}
                    onClick={() => navigate(tool.route)}
                    className={`min-w-[210px] h-[90px] flex-shrink-0 rounded-2xl px-5 py-4 cursor-pointer relative overflow-hidden ${colors[i]} shadow-sm hover:shadow-md`}
                  >

                    {/* TEXT */}

                    <p className="text-sm font-semibold text-gray-800">
                      {tool.name}
                    </p>

                    {/* IMAGE */}

                    <img
                      src={`${toolImages[i]}?q=80&w=400&sig=${i}`}
                      className="absolute right-2 bottom-[-15px] w-24 rotate-[12deg] object-cover rounded-lg"
                    />

                  </motion.div>

                )

              })}

            </div>

          </div>

          {/* RIGHT ARROW */}

          <button
            onClick={scrollRight}
            className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full w-11 h-11 flex items-center justify-center"
          >
            <FiChevronRight />
          </button>

        </div>

        {/* TEMPLATES */}

        <div className="mt-20 pb-20">

          <h2 className="text-2xl font-bold text-blue-900 mb-8">
            Ready Templates
          </h2>

          <div className="grid grid-cols-4 gap-6">

            {visibleTemplates.map((i) => (

              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-xl shadow border border-blue-100 overflow-hidden"
              >

                <img
                  src={`https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&sig=${i}`}
                  className="h-36 w-full object-cover"
                />

                <div className="p-4">

                  <h3 className="font-semibold text-blue-900 text-sm">
                    Template {i}
                  </h3>

                  <p className="text-xs text-gray-500">
                    Editable layout
                  </p>

                </div>

              </motion.div>

            ))}

          </div>

          <div className="flex justify-center gap-4 mt-8">

            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 disabled:opacity-40"
            >
              <FiChevronLeft />
              Prev
            </button>

            <button
              disabled={(page + 1) * perPage >= templates.length}
              onClick={() => setPage(page + 1)}
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg flex items-center gap-1"
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          >

            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-[700px] p-10 relative"
            >

              <button
                onClick={() => setShowCreate(false)}
                className="absolute top-6 right-6 text-gray-500"
              >
                <FiX size={22} />
              </button>

              <h2 className="text-2xl font-bold text-blue-900 mb-6">
                Quick Start
              </h2>

              <div className="flex bg-gray-100 rounded-full p-1 w-fit mb-8">

                <button
                  onClick={() => setTab("manual")}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition
            ${tab === "manual"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600"
                    }`}
                >
                  Manual
                </button>

                <button
                  onClick={() => setTab("ai")}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition
            ${tab === "ai"
                      ? "bg-yellow-400 text-black shadow"
                      : "text-gray-600"
                    }`}
                >
                  AI
                </button>

              </div>

              {/* IMPROVED CARDS */}

              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-6"
              >

                {(tab === "manual" ? manualTools : aiTools).map((tool, i) => {

                  const Icon = tool.icon;

                  return (

                    <div className={tab === "ai" ? "ai-tool-wrapper" : ""}>
                      <motion.div
                        key={i}

                        onClick={() => navigate(tool.route)}
                        className={`cursor-pointer rounded-2xl border border-blue-100 
    shadow-sm  transition flex flex-col items-center justify-center gap-3 h-[130px] relative
    ${tab === "ai" ? "ai-tool-inner" : "p-6 bg-gradient-to-br from-white to-yellow-50"}`}
                      >

                        <div className={`w-12 h-12 flex items-center justify-center rounded-xl
                ${tab === "ai" ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-amber-600"}`}>

                          <Icon size={22} />

                        </div>

                        <p className="font-semibold text-blue-900 text-sm">
                          {tool.title}
                        </p>

                        {tab === "ai" && (
                          <span className="absolute top-3 right-3 text-yellow-500">
                            <FiZap size={16} />
                          </span>
                        )}

                      </motion.div>
                    </div>

                  )

                })}

              </motion.div>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>

    </div>

  );

}