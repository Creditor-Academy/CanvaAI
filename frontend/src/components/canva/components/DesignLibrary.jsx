import React, { useState } from 'react';

const designTemplates = [
    {
        id: "wedding_1",
        category: "Wedding",
        name: "Elegant Wedding Invite",
        width: 800,
        height: 600,
        preview: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400",
        layers: [
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200",
                x: 0,
                y: 0,
                width: 800,
                height: 600
            },
            {
                type: "text",
                text: "Happy Marriage",
                x: 200,
                y: 80,
                width: 400,
                height: 60,
                fontSize: 36,
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "Rahul ❤ Priya",
                x: 200,
                y: 150,
                width: 400,
                height: 40,
                fontSize: 26,
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "25 December 2026",
                x: 200,
                y: 200,
                width: 400,
                height: 30,
                fontSize: 18,
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "Together is a beautiful place to be",
                x: 150,
                y: 260,
                width: 500,
                height: 30,
                fontSize: 16,
                color: "#ffffff",
                textAlign: "center"
            }
        ]
    },
    {
        id: "birthday_1",
        category: "Birthday",
        name: "Birthday Celebration",
        width: 800,
        height: 600,
        preview: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400",
        layers: [
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=1200",
                x: 0,
                y: 0,
                width: 800,
                height: 600
            },
            {
                type: "text",
                text: "Happy Birthday",
                x: 200,
                y: 160,
                width: 400,
                height: 60,
                fontSize: 40,
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "Rohan",
                x: 200,
                y: 230,
                width: 400,
                height: 40,
                fontSize: 26,
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "12 July 2026",
                x: 200,
                y: 280,
                width: 400,
                height: 30,
                fontSize: 18,
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "Another year, another adventure!",
                x: 150,
                y: 330,
                width: 500,
                height: 30,
                fontSize: 16,
                color: "#ffffff",
                textAlign: "center"
            }
        ]
    },
    {
        id: "invite_1",
        category: "Invitation",
        name: "Party Invitation",
        width: 800,
        height: 600,
        preview: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400",
        layers: [
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200",
                x: 0,
                y: 0,
                width: 800,
                height: 600
            },
            {
                type: "text",
                text: "You're Invited",
                x: 200,
                y: 170,
                width: 400,
                height: 50,
                fontSize: 36,
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "Saturday • 7 PM",
                x: 200,
                y: 230,
                width: 400,
                height: 30,
                fontSize: 20,
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "20 August 2026",
                x: 200,
                y: 270,
                width: 400,
                height: 30,
                fontSize: 18,
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "Let’s celebrate and make memories!",
                x: 150,
                y: 320,
                width: 500,
                height: 30,
                fontSize: 16,
                color: "#ffffff",
                textAlign: "center"
            }
        ]
    },
    {
        id: "social_1",
        category: "Social",
        name: "Instagram Post",
        width: 800,
        height: 600,
        preview: "https://cdn.pixabay.com/photo/2025/03/30/13/01/fairy-tale-9502808_1280.jpg",
        layers: [
            {
                type: "image",
                src: "https://cdn.pixabay.com/photo/2025/03/30/13/01/fairy-tale-9502808_1280.jpg",
                x: 0,
                y: 0,
                width: 800,
                height: 600
            },
            {
                type: "text",
                text: "New Collection",
                x: 150,
                y: 200,
                width: 500,
                height: 60,
                fontSize: 42,
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "Available Now",
                x: 200,
                y: 260,
                width: 400,
                height: 30,
                fontSize: 20,
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "Style that speaks for you",
                x: 150,
                y: 310,
                width: 500,
                height: 30,
                fontSize: 16,
                color: "#ffffff",
                textAlign: "center"
            }
        ]
    },
    {
        id: "nature_1",
        category: "Nature",
        name: "Cute Dog Post",
        width: 600,
        height: 800,
        preview: "https://cdn.pixabay.com/photo/2023/02/05/17/37/dog-7770063_1280.jpg",
        layers: [
            {
                type: "image",
                src: "https://cdn.pixabay.com/photo/2023/02/05/17/37/dog-7770063_1280.jpg",
                x: 0,
                y: 0,
                width: 600,
                height: 800
            },
            {
                type: "text",
                text: "Best Friend Forever",
                x: 80,
                y: 680,
                width: 440,
                height: 40,
                fontSize: 26,
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "Loyalty in its purest form",
                x: 80,
                y: 720,
                width: 440,
                height: 30,
                fontSize: 16,
                color: "#ffffff",
                textAlign: "center"
            }
        ]
    },
    {
        id: "nature_2",
        category: "Nature",
        name: "Nature Landscape",
        width: 600,
        height: 800,
        preview: "https://cdn.pixabay.com/photo/2026/01/18/17/55/17-55-14-137_1280.jpg",
        layers: [
            {
                type: "image",
                src: "https://cdn.pixabay.com/photo/2026/01/18/17/55/17-55-14-137_1280.jpg",
                x: 0,
                y: 0,
                width: 600,
                height: 800
            },
            {
                type: "text",
                text: "Explore Nature",
                x: 80,
                y: 680,
                width: 440,
                height: 40,
                fontSize: 26,
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "Nature is the best therapy",
                x: 80,
                y: 720,
                width: 440,
                height: 30,
                fontSize: 16,
                color: "#ffffff",
                textAlign: "center"
            }
        ]
    },
    {
        id: "nature_3",
        category: "Nature",
        name: "Bird Photography",
        width: 600,
        height: 800,
        preview: "https://cdn.pixabay.com/photo/2025/12/26/14/35/asian-green-bee-eater-10036230_1280.jpg",
        layers: [
            {
                type: "image",
                src: "https://cdn.pixabay.com/photo/2025/12/26/14/35/asian-green-bee-eater-10036230_1280.jpg",
                x: 0,
                y: 0,
                width: 600,
                height: 800
            },
            {
                type: "text",
                text: "Wildlife Moments",
                x: 80,
                y: 680,
                width: 440,
                height: 40,
                fontSize: 26,
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "Freedom in every flight",
                x: 80,
                y: 720,
                width: 440,
                height: 30,
                fontSize: 16,
                color: "#ffffff",
                textAlign: "center"
            }
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
