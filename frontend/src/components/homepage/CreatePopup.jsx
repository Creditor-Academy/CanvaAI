import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiX, FiZap } from "react-icons/fi";
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
            title: "AI Presentation",
            route: "/dashboard/ai-presentation"
        },
        {
            icon: FaRegImage,
            title: "AI Image",
            route: "/dashboard/create/ai-design"
        }
    ];

    const currentTools = tab === "manual" ? manualTools : aiTools;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-950/30 backdrop-blur-sm flex items-center justify-center z-[10000] p-6"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] w-full max-w-[480px] overflow-hidden relative border border-slate-100"
                    >
                        {/* Header */}
                        <div className="p-8 pb-0 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                    Create New
                                </h2>
                                <p className="text-slate-500 text-sm mt-1 font-medium">
                                    Select a tool to start your project
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-50 rounded-full"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="px-8 mt-8">
                            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-full">
                                <button
                                    onClick={() => setTab("manual")}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                        tab === "manual"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    Standard
                                </button>
                                <button
                                    onClick={() => setTab("ai")}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                                        tab === "ai"
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    AI Powered
                                    <FiZap size={14} className={tab === 'ai' ? 'text-indigo-500' : 'text-slate-400'} />
                                </button>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="p-8 pt-6">
                            <div className="grid grid-cols-2 gap-4">
                                {currentTools.map((tool, i) => {
                                    const Icon = tool.icon;
                                    const isAI = tab === 'ai';
                                    
                                    return (
                                        <motion.div
                                            key={i}
                                            whileHover={{ y: -4, backgroundColor: '#f8fafc', borderColor: isAI ? '#e0e7ff' : '#f1f5f9' }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                onClose();
                                                window.open(tool.route, "_blank");
                                            }}
                                            className={`cursor-pointer group p-6 rounded-[24px] border border-slate-100 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex flex-col items-center gap-4 transition-all`}
                                        >
                                            <div className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-colors ${
                                                isAI 
                                                ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100' 
                                                : 'bg-slate-50 text-slate-600 group-hover:bg-slate-100'
                                            }`}>
                                                <Icon size={24} />
                                            </div>
                                            <span className="font-bold text-slate-900 text-sm">
                                                {tool.title}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bottom Decoration */}
                        <div className="h-2 w-full bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-50" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CreatePopup;