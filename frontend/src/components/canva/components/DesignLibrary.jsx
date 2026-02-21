import React, { useState } from 'react';

export const designTemplates = [
    {
        id: "default_1",
        category: "Basic",
        name: "Standard Design",
        width: 800,
        height: 600,
        preview: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png", x: 0, y: 0, width: 800, height: 600 },
            { type: "text", text: "New Project", x: 200, y: 250, width: 400, height: 60, fontSize: 42, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "social_1",
        category: "Social",
        name: "Instagram Post",
        width: 1080,
        height: 1080,
        preview: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png", x: 0, y: 0, width: 1080, height: 1080 },
            { type: "text", text: "Morning Vibes", x: 290, y: 500, width: 500, height: 60, fontSize: 48, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "mobile_1",
        category: "Social",
        name: "TikTok Story",
        width: 1080,
        height: 1920,
        preview: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png", x: 0, y: 0, width: 1080, height: 1920 },
            { type: "text", text: "Link in Bio", x: 240, y: 1600, width: 600, height: 80, fontSize: 54, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "fb_1",
        category: "Social",
        name: "Facebook Header",
        width: 1200,
        height: 630,
        preview: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png", x: 0, y: 0, width: 1200, height: 630 },
            { type: "text", text: "Community Page", x: 300, y: 280, width: 600, height: 60, fontSize: 42, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "yt_1",
        category: "Video",
        name: "Video Thumbnail",
        width: 1280,
        height: 720,
        preview: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png", x: 0, y: 0, width: 1280, height: 720 },
            { type: "text", text: "How to Design", x: 200, y: 300, width: 1000, height: 100, fontSize: 80, fontWeight: "800", color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "biz_1",
        category: "Business",
        name: "Business Card Front",
        width: 1050,
        height: 600,
        preview: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png", x: 0, y: 0, width: 1050, height: 600 },
            { type: "text", text: "John Doe", x: 200, y: 220, width: 650, height: 50, fontSize: 36, color: "#ffffff", textAlign: "center" },
            { type: "text", text: "Creative Director", x: 200, y: 280, width: 650, height: 30, fontSize: 18, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "pres_1",
        category: "Business",
        name: "Slide Title",
        width: 1920,
        height: 1080,
        preview: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png", x: 0, y: 0, width: 1920, height: 1080 },
            { type: "text", text: "Annual Report 2026", x: 460, y: 480, width: 1000, height: 120, fontSize: 72, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "logo_1",
        category: "Branding",
        name: "Minimalist Logo",
        width: 800,
        height: 800,
        preview: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png", x: 0, y: 0, width: 800, height: 800 },
            { type: "text", text: "CREATIVE", x: 100, y: 350, width: 600, height: 100, fontSize: 64, fontWeight: "900", color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "poster_1",
        category: "Print",
        name: "Event Poster",
        width: 1080,
        height: 1350,
        preview: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png", x: 0, y: 0, width: 1080, height: 1350 },
            { type: "text", text: "MUSIC FEST", x: 140, y: 200, width: 800, height: 100, fontSize: 72, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "banner_1",
        category: "Web",
        name: "Web Hero",
        width: 1200,
        height: 300,
        preview: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png", x: 0, y: 0, width: 1200, height: 300 },
            { type: "text", text: "SUMMER SALE", x: 300, y: 120, width: 600, height: 60, fontSize: 48, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "flyer_1",
        category: "Print",
        name: "A4 Flyer",
        width: 850,
        height: 1100,
        preview: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/05/22/25/olivcelso-nature-10106842_1280.png", x: 0, y: 0, width: 850, height: 1100 },
            { type: "text", text: "GRAND OPENING", x: 125, y: 400, width: 600, height: 100, fontSize: 54, color: "#ffffff", textAlign: "center" }
        ]
    }
];

const DesignLibrary = ({ onSelect }) => {
    const [filter, setFilter] = useState("all");

    const handleSelect = (template) => {
        if (onSelect) onSelect(template);
    };

    const filteredTemplates =
        filter === "all"
            ? designTemplates
            : designTemplates.filter(template =>
                filter === "portrait"
                    ? template.height > template.width
                    : template.width > template.height
            );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2 text-white justify-between">
                <button onClick={() => setFilter("all")} className={`px-4 py-1 rounded-xl border ${filter === "all" ? "bg-blue-600 border-blue-400" : "bg-slate-800/40 border-slate-700"}`}>All</button>
                <button onClick={() => setFilter("portrait")} className={`px-4 py-1 rounded-xl border ${filter === "portrait" ? "bg-blue-600 border-blue-400" : "bg-slate-800/40 border-slate-700"}`}>Portraits</button>
                <button onClick={() => setFilter("landscape")} className={`px-4 py-1 rounded-xl border ${filter === "landscape" ? "bg-blue-600 border-blue-400" : "bg-slate-800/40 border-slate-700"}`}>Landscapes</button>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-20">
                {filteredTemplates.map((template) => (
                    <div
                        key={template.id}
                        onClick={() => handleSelect(template)}
                        className="bg-slate-800/40 rounded-xl border border-slate-700 hover:border-blue-500 cursor-pointer overflow-hidden group transition"
                    >
                        <img src={template.preview} alt={template.name} className="w-full h-32 object-cover group-hover:scale-105 transition" />
                        <div className="p-2">
                            <p className="text-xs font-semibold text-white">{template.name}</p>
                            <p className="text-[10px] text-slate-400">{template.width} × {template.height}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DesignLibrary;
