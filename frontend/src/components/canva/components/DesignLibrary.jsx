import React, { useState } from 'react';

const staticTemplates = [
    // -------------------- Default Canvas (800x600) --------------------
    {
        id: "default_1",
        category: "Basic",
        name: "Standard Design",
        width: 800,
        height: 600,
        preview: "https://cdn.pixabay.com/photo/2025/01/18/11/54/leaf-9341985_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2025/01/18/11/54/leaf-9341985_1280.jpg", x: 0, y: 0, width: 800, height: 600 },
            { type: "text", text: "New Project", x: 200, y: 250, width: 400, height: 60, fontSize: 42, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "default_2",
        category: "Basic",
        name: "Nature Scene",
        width: 800,
        height: 600,
        preview: "https://cdn.pixabay.com/photo/2026/02/02/18/41/flowers-10101432_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/02/18/41/flowers-10101432_1280.jpg", x: 0, y: 0, width: 800, height: 600 },
            { type: "text", text: "Outdoor Life", x: 100, y: 100, width: 600, height: 80, fontSize: 54, color: "#ffffff", textAlign: "left", fontWeight: "bold" }
        ]
    },
    {
        id: "default_3",
        category: "Basic",
        name: "Classic View",
        width: 800,
        height: 600,
        preview: "https://cdn.pixabay.com/photo/2026/02/03/15/16/old-library-10102767_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/03/15/16/old-library-10102767_1280.jpg", x: 0, y: 0, width: 800, height: 600 },
            { type: "text", text: "Architecture", x: 400, y: 250, width: 350, height: 60, fontSize: 36, color: "#ffffff", textAlign: "right" }
        ]
    },

    // -------------------- Social Media Post (1080x1080) --------------------
    {
        id: "social_1",
        category: "Social",
        name: "Instagram Post",
        width: 1080,
        height: 1080,
        preview: "https://cdn.pixabay.com/photo/2026/02/11/15/36/dpaolaphoto-ipanema-10117990_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/11/15/36/dpaolaphoto-ipanema-10117990_1280.jpg", x: 0, y: 0, width: 1080, height: 1080 },
            { type: "text", text: "Morning Vibes", x: 290, y: 500, width: 500, height: 60, fontSize: 48, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "social_2",
        category: "Social",
        name: "Daily Quote",
        width: 1080,
        height: 1080,
        preview: "https://cdn.pixabay.com/photo/2026/01/23/18/35/18-35-24-517_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/01/23/18/35/18-35-24-517_1280.jpg", x: 0, y: 0, width: 1080, height: 1080 },
            { type: "text", text: "Stay Inspired", x: 140, y: 400, width: 800, height: 120, fontSize: 72, color: "#ffffff", textAlign: "center", fontWeight: "800" }
        ]
    },
    {
        id: "social_3",
        category: "Social",
        name: "Product Showcase",
        width: 1080,
        height: 1080,
        preview: "https://cdn.pixabay.com/photo/2026/02/04/13/24/13-24-30-312_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/04/13/24/13-24-30-312_1280.jpg", x: 0, y: 0, width: 1080, height: 1080 },
            { type: "text", text: "Fresh Designs", x: 0, y: 750, width: 1080, height: 100, fontSize: 80, color: "#ffffff", textAlign: "center", fontWeight: "900" }
        ]
    },

    // -------------------- Mobile View (1080x1920) --------------------
    {
        id: "mobile_1",
        category: "Social",
        name: "TikTok Story",
        width: 1080,
        height: 1920,
        preview: "https://cdn.pixabay.com/photo/2026/02/11/15/36/dpaolaphoto-ipanema-10117990_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/11/15/36/dpaolaphoto-ipanema-10117990_1280.jpg", x: 0, y: 0, width: 1080, height: 1920 },
            { type: "text", text: "Link in Bio", x: 240, y: 1600, width: 600, height: 80, fontSize: 54, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "mobile_2",
        category: "Social",
        name: "Story Highlight",
        width: 1080,
        height: 1920,
        preview: "https://cdn.pixabay.com/photo/2025/11/30/18/17/shrub-9986901_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2025/11/30/18/17/shrub-9986901_1280.jpg", x: 0, y: 0, width: 1080, height: 1920 },
            { type: "text", text: "NEW ARRIVAL", x: 90, y: 200, width: 900, height: 100, fontSize: 84, color: "#ffffff", textAlign: "center", fontWeight: "900" }
        ]
    },
    {
        id: "mobile_3",
        category: "Social",
        name: "Travel Vlog",
        width: 1080,
        height: 1920,
        preview: "https://cdn.pixabay.com/photo/2026/02/13/15/27/15-27-30-567_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/13/15/27/15-27-30-567_1280.jpg", x: 0, y: 0, width: 1080, height: 1920 },
            { type: "text", text: "EXPLORE", x: 0, y: 800, width: 1080, height: 120, fontSize: 100, color: "#ffffff", textAlign: "center", fontWeight: "100" }
        ]
    },

    // -------------------- Facebook Cover (1200x630) --------------------
    {
        id: "fb_1",
        category: "Social",
        name: "Facebook Header",
        width: 1200,
        height: 630,
        preview: "https://cdn.pixabay.com/photo/2026/02/04/13/24/13-24-30-312_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/04/13/24/13-24-30-312_1280.jpg", x: 0, y: 0, width: 1200, height: 630 },
            { type: "text", text: "Community Page", x: 300, y: 280, width: 600, height: 60, fontSize: 42, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "fb_2",
        category: "Social",
        name: "Business Cover",
        width: 1200,
        height: 630,
        preview: "https://cdn.pixabay.com/photo/2026/02/03/15/16/old-library-10102767_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/03/15/16/old-library-10102767_1280.jpg", x: 0, y: 0, width: 1200, height: 630 },
            { type: "text", text: "Welcome to our page", x: 100, y: 450, width: 1000, height: 60, fontSize: 48, color: "#ffffff", textAlign: "left", fontWeight: "bold" }
        ]
    },
    {
        id: "fb_3",
        category: "Social",
        name: "Event Banner",
        width: 1200,
        height: 630,
        preview: "https://cdn.pixabay.com/photo/2026/02/02/18/41/flowers-10101432_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/02/18/41/flowers-10101432_1280.jpg", x: 600, y: 0, width: 600, height: 630 },
            { type: "text", text: "LIVE EVENT", x: 100, y: 280, width: 400, height: 80, fontSize: 64, color: "#333333", textAlign: "left", fontWeight: "900" }
        ]
    },

    // -------------------- YouTube Thumbnail (1280x720) --------------------
    {
        id: "yt_1",
        category: "Video",
        name: "Video Thumbnail",
        width: 1280,
        height: 720,
        preview: "https://cdn.pixabay.com/photo/2026/01/23/18/35/18-35-24-517_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/01/23/18/35/18-35-24-517_1280.jpg", x: 0, y: 0, width: 1280, height: 720 },
            { type: "text", text: "How to Design", x: 200, y: 300, width: 1000, height: 100, fontSize: 80, fontWeight: "800", color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "yt_2",
        category: "Video",
        name: "Gaming Guide",
        width: 1280,
        height: 720,
        preview: "https://cdn.pixabay.com/photo/2025/01/18/11/54/leaf-9341985_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2025/01/18/11/54/leaf-9341985_1280.jpg", x: 0, y: 0, width: 1280, height: 720 },
            { type: "text", text: "PRO TIPS", x: 50, y: 500, width: 500, height: 100, fontSize: 96, color: "#ffff00", textAlign: "left", fontWeight: "900" }
        ]
    },
    {
        id: "yt_3",
        category: "Video",
        name: "Review Video",
        width: 1280,
        height: 720,
        preview: "https://cdn.pixabay.com/photo/2026/02/04/13/24/13-24-30-312_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/04/13/24/13-24-30-312_1280.jpg", x: 0, y: 0, width: 400, height: 720 },
            { type: "text", text: "UNBOXING", x: 450, y: 300, width: 800, height: 100, fontSize: 72, color: "#ffffff", textAlign: "center" }
        ]
    },

    // -------------------- Banner (1200x300) --------------------
    {
        id: "banner_1",
        category: "Web",
        name: "Web Hero",
        width: 1200,
        height: 300,
        preview: "https://cdn.pixabay.com/photo/2026/01/23/18/35/18-35-24-517_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/01/23/18/35/18-35-24-517_1280.jpg", x: 0, y: 0, width: 1200, height: 300 },
            { type: "text", text: "SUMMER SALE", x: 300, y: 120, width: 600, height: 60, fontSize: 48, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "banner_2",
        category: "Web",
        name: "Header Banner",
        width: 1200,
        height: 300,
        preview: "https://cdn.pixabay.com/photo/2026/02/11/15/36/dpaolaphoto-ipanema-10117990_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/11/15/36/dpaolaphoto-ipanema-10117990_1280.jpg", x: 0, y: 0, width: 1200, height: 300 },
            { type: "text", text: "Welcome to our store", x: 50, y: 100, width: 1100, height: 100, fontSize: 42, color: "#ffffff", textAlign: "left" }
        ]
    },
    {
        id: "banner_3",
        category: "Web",
        name: "Discount Promo",
        width: 1200,
        height: 300,
        preview: "https://cdn.pixabay.com/photo/2025/01/18/11/54/leaf-9341985_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2025/01/18/11/54/leaf-9341985_1280.jpg", x: 0, y: -200, width: 1200, height: 720 },
            { type: "text", text: "20% OFF", x: 800, y: 100, width: 350, height: 100, fontSize: 64, color: "#ffffff", textAlign: "center", fontWeight: "900" }
        ]
    },

    // -------------------- Business Card (1050x600) --------------------
    {
        id: "biz_1",
        category: "Business",
        name: "Modern Card",
        width: 1050,
        height: 600,
        preview: "https://cdn.pixabay.com/photo/2026/02/03/15/16/old-library-10102767_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/03/15/16/old-library-10102767_1280.jpg", x: 0, y: 0, width: 1050, height: 600 },
            { type: "text", text: "John Smith", x: 100, y: 150, width: 850, height: 60, fontSize: 48, color: "#ffffff", textAlign: "left", fontWeight: "bold" },
            { type: "text", text: "Architect", x: 100, y: 220, width: 850, height: 40, fontSize: 24, color: "#ffffff", textAlign: "left" }
        ]
    },
    {
        id: "biz_2",
        category: "Business",
        name: "Organic Identity",
        width: 1050,
        height: 600,
        preview: "https://cdn.pixabay.com/photo/2025/01/18/11/54/leaf-9341985_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2025/01/18/11/54/leaf-9341985_1280.jpg", x: 0, y: 0, width: 1050, height: 600 },
            { type: "text", text: "Green Solutions", x: 200, y: 280, width: 650, height: 50, fontSize: 36, color: "#ffffff", textAlign: "center", fontWeight: "bold" }
        ]
    },
    {
        id: "biz_3",
        category: "Business",
        name: "Creative Spirit",
        width: 1050,
        height: 600,
        preview: "https://cdn.pixabay.com/photo/2026/02/02/18/41/flowers-10101432_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/02/18/41/flowers-10101432_1280.jpg", x: 0, y: 0, width: 1050, height: 600 },
            { type: "text", text: "ARTIST", x: 400, y: 200, width: 500, height: 100, fontSize: 72, color: "#ffffff", textAlign: "center", fontWeight: "100" }
        ]
    },

    // -------------------- Presentation (1920x1080) --------------------
    {
        id: "pres_1",
        category: "Business",
        name: "Welcome Slide",
        width: 1920,
        height: 1080,
        preview: "https://cdn.pixabay.com/photo/2026/02/03/15/16/old-library-10102767_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/03/15/16/old-library-10102767_1280.jpg", x: 0, y: 0, width: 1920, height: 1080 },
            { type: "text", text: "ANNUAL REPORT", x: 460, y: 450, width: 1000, height: 150, fontSize: 100, color: "#ffffff", textAlign: "center", fontWeight: "900" }
        ]
    },
    {
        id: "pres_2",
        category: "Business",
        name: "Project Review",
        width: 1920,
        height: 1080,
        preview: "https://cdn.pixabay.com/photo/2026/02/13/15/27/15-27-30-567_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/13/15/27/15-27-30-567_1280.jpg", x: 0, y: 0, width: 1920, height: 1080 },
            { type: "text", text: "Monthly Update", x: 100, y: 100, width: 800, height: 80, fontSize: 48, color: "#ffffff", textAlign: "left" }
        ]
    },

    // -------------------- Logo (800x800) --------------------
    {
        id: "logo_1",
        category: "Branding",
        name: "Minimal Logo",
        width: 800,
        height: 800,
        preview: "https://cdn.pixabay.com/photo/2025/01/18/11/54/leaf-9341985_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2025/01/18/11/54/leaf-9341985_1280.jpg", x: 200, y: 200, width: 400, height: 400 },
            { type: "text", text: "BRAND", x: 0, y: 650, width: 800, height: 60, fontSize: 48, color: "#333333", textAlign: "center", fontWeight: "900" }
        ]
    },
    {
        id: "logo_2",
        category: "Branding",
        name: "Eco Emblem",
        width: 800,
        height: 800,
        preview: "https://cdn.pixabay.com/photo/2025/11/30/18/17/shrub-9986901_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2025/11/30/18/17/shrub-9986901_1280.jpg", x: 100, y: 100, width: 600, height: 600 },
            { type: "text", text: "NATURE", x: 0, y: 400, width: 800, height: 80, fontSize: 72, color: "#ffffff", textAlign: "center", fontWeight: "bold" }
        ]
    },

    // -------------------- Poster (1080x1350) --------------------
    {
        id: "poster_1",
        category: "Print",
        name: "Event Poster",
        width: 1080,
        height: 1350,
        preview: "https://cdn.pixabay.com/photo/2026/02/13/15/27/15-27-30-567_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/13/15/27/15-27-30-567_1280.jpg", x: 0, y: 0, width: 1080, height: 1350 },
            { type: "text", text: "MUSIC FEST", x: 140, y: 200, width: 800, height: 100, fontSize: 72, color: "#ffffff", textAlign: "center" }
        ]
    },
    {
        id: "poster_2",
        category: "Print",
        name: "Art Gallery",
        width: 1080,
        height: 1350,
        preview: "https://cdn.pixabay.com/photo/2026/02/03/15/16/old-library-10102767_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/02/03/15/16/old-library-10102767_1280.jpg", x: 0, y: 300, width: 1080, height: 1050 },
            { type: "text", text: "EXHIBITION", x: 0, y: 100, width: 1080, height: 80, fontSize: 96, color: "#000000", textAlign: "center", fontWeight: "200" }
        ]
    },

    // -------------------- Flyer (850x1100) --------------------
    {
        id: "flyer_1",
        category: "Print",
        name: "A4 Flyer",
        width: 850,
        height: 1100,
        preview: "https://cdn.pixabay.com/photo/2026/01/23/18/35/18-35-24-517_1280.jpg",
        layers: [
            { type: "image", src: "https://cdn.pixabay.com/photo/2026/01/23/18/35/18-35-24-517_1280.jpg", x: 0, y: 0, width: 850, height: 1100 },
            { type: "text", text: "GRAND OPENING", x: 125, y: 400, width: 600, height: 100, fontSize: 54, color: "#ffffff", textAlign: "center" }
        ]
    }
];

const quotes = [
    "Design is thinking made visual.",
    "Creativity is intelligence having fun.",
    "Simplicity is the ultimate sophistication.",
    "Digital design is like painting.",
    "Good design is obvious. Great design is transparent.",
    "An image is worth a thousand words.",
    "The soul of a brand is the design.",
    "Styles come and go. Good design is a language.",
    "Innovation is the outcome of a habit.",
    "Success is where preparation meets opportunity.",
    "Design is the silent ambassador of your brand.",
    "Content precedes design. Design in the absence of content is decoration.",
    "Color is a power which directly influences the soul.",
    "Less is more. Minimalism is not lack of something. It’s simply the perfect amount.",
    "Design is not just what it looks like and feels like. Design is how it works.",
    "Design is where science and art break even.",
    "The details are not the details. They make the design.",
    "Thinking is the hardest work there is.",
    "Every child is an artist. The problem is how to remain an artist once we grow up.",
    "Imagination is the beginning of creation.",
    "Art is the only way to run away without leaving home.",
    "Logic will get you from A to B. Imagination will take you everywhere.",
    "Don't wait for inspiration. It comes while you work.",
    "Believe you can and you're halfway there.",
    "Quality is not an act, it is a habit.",
    "Start where you are. Use what you have. Do what you can.",
    "Everything you can imagine is real.",
    "Action is the foundational key to all success."
];

const currentDateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

export const designTemplates = staticTemplates.map((template, idx) => ({
    ...template,
    layers: [
        ...template.layers,
        {
            id: `quote_${template.id}`,
            type: "text",
            text: quotes[idx % quotes.length],
            x: template.width * 0.1,
            y: template.height * 0.8,
            width: template.width * 0.8,
            height: 40,
            fontSize: Math.max(16, Math.floor(template.width / 40)),
            color: "#ffffff",
            textAlign: "center",
            fontStyle: "italic",
            opacity: 90,
            locked: false,
            visible: true
        },
        {
            id: `date_${template.id}`,
            type: "text",
            text: currentDateStr,
            x: template.width - 160,
            y: template.height - 40,
            width: 150,
            height: 30,
            fontSize: 12,
            color: "#ffffff",
            textAlign: "right",
            opacity: 70,
            locked: false,
            visible: true
        }
    ]
}));

/* -------------------- Component -------------------- */

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

