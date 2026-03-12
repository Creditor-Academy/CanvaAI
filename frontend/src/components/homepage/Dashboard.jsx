import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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
  "https://images.pexels.com/photos/221185/pexels-photo-221185.jpeg",
  "https://images.pexels.com/photos/160994/family-outdoor-happy-happiness-160994.jpeg",
  "https://images.pexels.com/photos/256467/pexels-photo-256467.jpeg",
  "https://images.pexels.com/photos/6476783/pexels-photo-6476783.jpeg",
  "https://images.pexels.com/photos/161963/chicago-illinois-skyline-skyscrapers-161963.jpeg",
  "https://images.pexels.com/photos/590045/pexels-photo-590045.jpeg"
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

    (async () => {

      try {
        const data = await api.getProfile();
        if (mounted) setProfile(data || null);
      } catch { }

    })();

    return () => mounted = false;

  }, []);

  const fullName =
    profile?.firstName
      ? `${profile.firstName} ${profile.lastName || ""}`
      : profile?.email?.split("@")[0] || "User";

  const tokens = profile?.tokens || 120;

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
                {tokens}
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
                      className="absolute right-2 bottom-[-2px] w-24 rotate-[12deg] object-cover rounded-lg"
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

                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.06, y: -4 }}
                      onClick={() => navigate(tool.route)}
                      className="cursor-pointer p-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 shadow-sm hover:shadow-xl transition flex flex-col items-center justify-center gap-3 h-[130px] relative"
                    >

                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl
                ${tab === "ai" ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600"}`}>

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