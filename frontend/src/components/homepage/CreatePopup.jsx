import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    FiX,
    FiZap
} from "react-icons/fi";
import { HiOutlinePresentationChartLine } from "react-icons/hi2";
import { FaRegImage } from "react-icons/fa";

const CreatePopup = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [tab, setTab] = useState("manual");

    const manualTools = [
        {
            icon: HiOutlinePresentationChartLine,
            title: "Presentation",
            route: "/presentation-editor-v3"
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
            route: "/dashboard/ai-presentation"
        },
        {
            icon: FaRegImage,
            title: "AI Image",
            route: "/dashboard/create/ai-design"
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[10000] p-4 sm:p-5"
                >
                    <motion.div
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="bg-white/85 backdrop-blur-xl rounded-[24px] sm:rounded-3xl shadow-[0_30px_80px_rgba(15,23,42,0.25)] w-full max-w-[560px] max-h-[90vh] overflow-y-auto p-5 sm:p-6 md:p-7 lg:p-8 relative border border-white/70"
                    >
                        {/* CLOSE BUTTON */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-600 hover:text-slate-900 w-10 h-10 rounded-full bg-white/70 hover:bg-white flex items-center justify-center border border-white/60 shadow-sm"
                        >
                            <FiX size={22} />
                        </button>

                        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-5 sm:mb-6">
                            Quick Start
                        </h2>

                        {/* TAB SWITCH */}
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

                        {/* AI TOOLS */}
                        {tab === "ai" ? (
                            <motion.div
                                key="ai"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
                            >
                                {aiTools.map((tool, i) => {
                                    const Icon = tool.icon;
                                    return (
                                        <div className="ai-tool-wrapper" key={i}>
                                            <motion.div
                                                onClick={() => {
                                                    onClose();       // ✅ close popup
                                                    window.open(tool.route, "_blank"); // ✅ then navigate
                                                }}
                                                className="cursor-pointer rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center gap-3 h-[120px] sm:h-[130px] relative ai-tool-inner"
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
                            /* MANUAL TOOLS */
                            <motion.div
                                key="manual"
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
                                            onClick={() => {
                                                onClose();       // ✅ close popup
                                                window.open(tool.route, "_blank"); // ✅ then navigate
                                            }}
                                            className="cursor-pointer rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50 shadow-md flex flex-col items-center justify-center gap-3 h-[120px] sm:h-[130px]"
                                        >
                                            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                                <Icon size={22} />
                                            </div>

                                            <p className="font-semibold text-blue-900 text-sm">
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
    );
};

export default CreatePopup;