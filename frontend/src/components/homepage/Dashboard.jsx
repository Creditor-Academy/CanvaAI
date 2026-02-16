import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiZap,
  FiLayout,
  FiImage,
  FiFileText,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { RiPresentationFill } from "react-icons/ri";
import { HiOutlinePresentationChartLine } from "react-icons/hi2";
import { IoDocument } from "react-icons/io5";
import { MdOutlineDocumentScanner } from "react-icons/md";
import { CiImageOn } from "react-icons/ci";   // ✅ correct
import { FaRegImages } from "react-icons/fa";
import Creation from "./Creation";
import AISuggestTemp from "./AISuggestTemp";
import Recents from "./Recents";

/* ===== BRAND COLORS ===== */
const COLORS = {
  deepBlue: "#1d3fAf",
  primaryBlue: "#60a5fa",
  Grey: "#455469",
  gold: "#fabf23",
  lightGold: "#f8d77d",
  navyText: "#0c496e",
  bgLight: "#f9fafb",
};
const {
  deepBlue,
  primaryBlue,
  Grey,
  gold,
  lightGold,
  navyText,
  bgLight,
} = COLORS;


const TABS = [
  { key: "your-designs", label: "Your designs" },
  { key: "templates", label: "Templates" },
  { key: "ai", label: "AI" },
];
const QUICK_CREATE = [
  {
    label: "Presentation",
    defaultIcon: HiOutlinePresentationChartLine,
    hoverIcon: RiPresentationFill,
    route: "/presentation",
    color1: deepBlue,
    color2: primaryBlue,
  },
  {
    label: "Document",
    defaultIcon: IoDocument,
    hoverIcon: MdOutlineDocumentScanner,
    route: "/editor",
    color1: gold,
    color2: lightGold,
  },
  {
    label: "Image Editing",
    defaultIcon: CiImageOn,
    hoverIcon: FaRegImages,
    route: "/canva-clone",
    color1: navyText,
    color2: primaryBlue,
  },
];




const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("your-designs");
  const [inputText, setInputText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [uploadType, setUploadType] = useState(null);
  const [appliedSearch, setAppliedSearch] = useState("");



  const getPlaceholder = () => {
    if (activeTab === "your-designs") return "Search your designs...";
    if (activeTab === "templates") return "Search templates...";
    return "Create your design...";
  };

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden px-4 py-12"
      style={{
        background:
          "linear-gradient(135deg,#e0f2ff 0%,#eff6ff 40%,#ffffff 100%)",
      }}
    >
      {/* ================= HEADER ================= */}
      <div className="max-w-5xl mx-auto text-center">

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
          <span
            className="bg-gradient-to-r bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg,#1e40af 0%,#3b82f6 50%,#60a5fa 100%)",
              backgroundSize: "200% auto",
            }}
          >
            {activeTab === "templates" && "Create using templates"}
            {activeTab === "ai" && "Create with AI"}
            {activeTab === "your-designs" && "Create your next big idea"}
          </span>
        </h1>

        <p className="mt-4 text-slate-600 text-sm sm:text-lg">
          Design presentations, documents and images effortlessly
        </p>

        <div className="mt-8 flex justify-center gap-4 flex-wrap relative">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300
    ${active
                    ? "text-white shadow-lg"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-[#f5f5f5] hover:shadow-md"
                  }
  `}
                style={
                  active
                    ? {
                      background: navyText,
                    }
                    : {}
                }
              >
                {tab.label}
              </button>

            );
          })}
        </div>
      </div>

      {/* ================= MAIN BOX ================= */}
      <div className="max-w-4xl mx-auto mt-12">
        <div
          className="rounded-3xl shadow-xl overflow-hidden border"
          style={{
            background: "#ffffff",
            backdropFilter: "blur(12px)",
            borderColor: Grey,
          }}
        >
          {/* ===== INPUT ROW ===== */}
          <div className="flex items-center gap-3 px-5 py-5">

            <button
              onClick={() => {
                if (activeTab === "ai") {
                  setUploadType("choose");
                }
              }}
              className="w-10 h-10 rounded-full border border-dashed flex items-center justify-center text-slate-500 hover:bg-[#f5f5f5] transition"
            >
              {activeTab === "ai" ? <FiPlus /> : <FiSearch />}
            </button>


            <input
              type="text"
              placeholder={getPlaceholder()}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 outline-none text-sm sm:text-base bg-transparent"
            />

            <button
              onClick={() => {
                if (activeTab !== "ai") {
                  setAppliedSearch(inputText);
                }
              }}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white transition transform hover:scale-105"
              style={{
                background:navyText
              }}
            >
              <FiZap />
            </button>

          </div>

          {/* YOUR DESIGNS */}
          {activeTab === "your-designs" && (
            <div className="bg-[#f5f5f5] px-5 py-4 flex flex-col gap-4">

              <div className="flex flex-wrap gap-6">

                <div className="flex py-4 gap-4">

                  {(selectedCategory !== "all" || selectedDate !== "all") && (
                    <div className="px-3 py-1 bg-white border  rounded-full shadow">
                      <FiX
                        className="cursor-pointer text-slate-600"
                        onClick={() => {
                          setSelectedCategory("all");
                          setSelectedDate("all");
                        }}
                      />
                    </div>
                  )}


                </div>
                {/* Category */}

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1 px-5 py-2 rounded-full text-sm border border=[#0c496e]"
                >
                  <option value="all">All Categories</option>
                  <option value="presentation">Presentation</option>
                  <option value="document">Document</option>
                  <option value="image">Image</option>
                </select>


                {/* Date */}

                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mt-1 px-5 py-2 rounded-full text-sm border border-[#0c496e]"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>




              </div>



            </div>
          )}

          {/* TEMPLATES */}
          {activeTab === "templates" && (
            <div className="bg-[#f5f5f5] px-5 py-4 flex flex-wrap gap-4">
              {[
                "Modern PPT",
                "Simple PPT",
                "Creative Slides",
                "Minimal Layout",
                "Clean Design",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-5 py-2 rounded-full bg-[#f5f5f5] border border-[#0c496e] text-sm font-medium hover:shadow-lg hover:-translate-y-1 transition cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* AI OPTIONS */}
          {activeTab === "ai" && (
            <div className="bg-[#f5f5f5] px-5 py-4 flex flex-wrap gap-4">

              <button
                onClick={() => navigate("/presentation")}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#f5f5f5] border border-[#0c496e] text-sm font-medium hover:shadow-lg hover:-translate-y-1 transition"
              >
                <FiLayout /> Design PPT
              </button>

              <button
                onClick={() => navigate("/image-editor")}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#f5f5f5] border border-[#0c496e] text-sm font-medium hover:shadow-lg hover:-translate-y-1 transition"
              >
                <FiImage /> Generate Image
              </button>

              <button
                onClick={() => navigate("/editor")}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#f5f5f5] border border-[#0c496e] text-sm font-medium hover:shadow-lg hover:-translate-y-1 transition"
              >
                <FiFileText /> Generate Document
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === "your-designs" && (
        <div className="max-w-6xl mx-auto mt-14 space-y-10">

          {/* ===== QUICK CREATE ICON ROW ===== */}
          <div className="flex flex-wrap justify-center gap-10">

            {QUICK_CREATE.map((item, index) => {
              const DefaultIcon = item.defaultIcon;
              const HoverIcon = item.hoverIcon;


              return (
                <div
                  key={index}
                  onClick={() => navigate(item.route)}
                  className="flex -mb-12 flex-col items-center cursor-pointer group transition-all duration-500"
                >
                  {/* Circle */}
                  <div
                    className="relative w-15 h-15 flex items-center justify-center rounded-full text-white text-3xl transition-all duration-500 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${item.color1}, ${item.color2})`,
                      boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                    }}
                  >
                    {/* Default Icon */}
                    <DefaultIcon className="absolute transition-all duration-300 opacity-100 group-hover:opacity-0 scale-100 group-hover:scale-0" />

                    {/* Hover Icon */}
                    <HoverIcon className="absolute transition-all duration-300 opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100" />
                  </div>

                  {/* Label */}
                  <span className="mt-3 text-sm font-semibold text-slate-800 group-hover:text-[#0c496e] transition">
                    {item.label}
                  </span>

                  {/* Subtitle */}
                  <span className="text-xs font-medium text-slate-500 group-hover:text-[#0c496e] transition">
                    Create
                  </span>
                </div>
              );
            })}

          </div>


          {/* Show Suggested ONLY when no filter active */}
          {selectedCategory === "all" &&
            selectedDate === "all" &&
            appliedSearch.trim() === "" && (
              <AISuggestTemp />
            )}


          {/* Recents always visible */}
          <Recents
            selectedCategory={selectedCategory}
            selectedDate={selectedDate}
            searchQuery={appliedSearch}
          />


        </div>
      )}


      {activeTab === "templates" && (
        <div className="max-w-6xl mx-auto mt-14">
          <Creation searchQuery={inputText} />
        </div>
      )}

      <p className="mt-16 text-center text-xs text-slate-500">
        AI generated results may contain inaccuracies. Please verify important information.
      </p>
      {uploadType && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-80">

            {uploadType === "choose" && (
              <>
                <h3 className="text-lg font-semibold mb-4">Upload Media</h3>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setUploadType("image")}
                    className="px-4 py-2 border rounded-xl hover:[#f5f5f5]"
                  >
                    Upload Image
                  </button>

                  <button
                    onClick={() => setUploadType("document")}
                    className="px-4 py-2 border rounded-xl hover:[#f5f5f5]"
                  >
                    Upload Document
                  </button>
                </div>
              </>
            )}

            {(uploadType === "image" || uploadType === "document") && (
              <>
                <input
                  type="file"
                  accept={
                    uploadType === "image"
                      ? "image/*"
                      : ".pdf,.doc,.docx,.txt"
                  }
                  onChange={(e) => {
                    const file = e.target.files[0];
                    console.log("Selected File:", file);
                    setUploadType(null);
                  }}
                />
              </>
            )}

            <button
              onClick={() => setUploadType(null)}
              className="mt-4 text-sm text-[#0c496e]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;