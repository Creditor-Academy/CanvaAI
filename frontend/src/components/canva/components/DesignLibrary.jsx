import React from 'react';

/**
 * Canva-style Design Library
 * Each template contains:
 * - canvas size
 * - preview image
 * - layers (text, images, frames)
 */

const designTemplates = [
    // ================= WEDDING =================
    {
        id: "wedding_1",
        category: "Wedding",
        name: "Elegant Wedding Invite",
        width: 800,
        height: 600,
        preview:
            "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400",

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
                type: "image",
                src: "https://pngimg.com/uploads/frame/frame_PNG26.png",
                x: 0,
                y: 0,
                width: 800,
                height: 600
            },
            {
                type: "text",
                text: "Wedding Invitation",
                x: 180,
                y: 120,
                width: 440,
                height: 80,
                fontSize: 36,
                fontWeight: "700",
                color: "#000",
                textAlign: "center"
            },
            {
                type: "text",
                text: "Rahul ❤ Priya",
                x: 200,
                y: 220,
                width: 400,
                height: 60,
                fontSize: 28,
                color: "#000",
                textAlign: "center"
            }
        ]
    },

    // ================= BIRTHDAY =================
    {
        id: "birthday_1",
        category: "Birthday",
        name: "Birthday Celebration",
        width: 800,
        height: 600,
        preview:
            "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400",

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
                text: "Happy Birthday!",
                x: 180,
                y: 200,
                width: 440,
                height: 80,
                fontSize: 42,
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center"
            }
        ]
    },

    // ================= INVITATION =================
    {
        id: "invite_1",
        category: "Invitation",
        name: "Party Invitation",
        width: 800,
        height: 600,
        preview:
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400",

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
                text: "You're Invited!",
                x: 200,
                y: 180,
                width: 400,
                height: 80,
                fontSize: 38,
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center"
            },
            {
                type: "text",
                text: "Saturday • 7 PM",
                x: 220,
                y: 260,
                width: 360,
                height: 60,
                fontSize: 22,
                color: "#ffffff",
                textAlign: "center"
            }
        ]
    },

    // ================= SOCIAL =================
    {
        id: "social_1",
        category: "Social",
        name: "Instagram Post",
        width: 800,
        height: 800,
        preview:
            "https://images.unsplash.com/photo-1529336953121-ad5a0d43d0d2?w=400",

        layers: [
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1529336953121-ad5a0d43d0d2?w=1200",
                x: 0,
                y: 0,
                width: 800,
                height: 800
            },
            {
                type: "text",
                text: "New Collection",
                x: 150,
                y: 320,
                width: 500,
                height: 100,
                fontSize: 40,
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center"
            }
        ]
    },

    // ================= NATURE / ANIMALS =================
    {
        id: "nature_1",
        category: "Nature",
        name: "Cute Dog Post",
        width: 800,
        height: 800,
        preview:
            "https://cdn.pixabay.com/photo/2023/02/05/17/37/dog-7770063_1280.jpg",

        layers: [
            {
                type: "image",
                src: "https://cdn.pixabay.com/photo/2023/02/05/17/37/dog-7770063_1280.jpg",
                x: 0,
                y: 0,
                width: 800,
                height: 800
            },
            {
                type: "text",
                text: "Best Friend Forever",
                x: 150,
                y: 650,
                width: 500,
                height: 80,
                fontSize: 32,
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center"
            }
        ]
    },

    {
        id: "nature_2",
        category: "Nature",
        name: "Nature Landscape",
        width: 800,
        height: 600,
        preview:
            "https://cdn.pixabay.com/photo/2026/01/18/17/55/17-55-14-137_1280.jpg",

        layers: [
            {
                type: "image",
                src: "https://cdn.pixabay.com/photo/2026/01/18/17/55/17-55-14-137_1280.jpg",
                x: 0,
                y: 0,
                width: 800,
                height: 600
            },
            {
                type: "text",
                text: "Explore Nature",
                x: 180,
                y: 250,
                width: 440,
                height: 80,
                fontSize: 36,
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center"
            }
        ]
    },

    {
        id: "nature_3",
        category: "Nature",
        name: "Bird Photography",
        width: 800,
        height: 600,
        preview:
            "https://cdn.pixabay.com/photo/2025/12/26/14/35/asian-green-bee-eater-10036230_1280.jpg",

        layers: [
            {
                type: "image",
                src: "https://cdn.pixabay.com/photo/2025/12/26/14/35/asian-green-bee-eater-10036230_1280.jpg",
                x: 0,
                y: 0,
                width: 800,
                height: 600
            },
            {
                type: "text",
                text: "Wildlife Moments",
                x: 180,
                y: 260,
                width: 440,
                height: 80,
                fontSize: 34,
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center"
            }
        ]
    }
];

/**
 * Component used inside ExpandedSectionPortal
 * Props:
 * - onSelect(template)
 */
const DesignLibrary = ({ onSelect }) => {
    const handleSelect = (template) => {
        if (onSelect) {
            onSelect(template);
        }
    };

    return (
        <div className="grid grid-cols-2 gap-4 pb-20">
            {designTemplates.map((template) => (
                <div
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className="bg-slate-800/40 rounded-xl border border-slate-700 hover:border-blue-500 cursor-pointer overflow-hidden group transition"
                >
                    <img
                        src={template.preview}
                        alt={template.name}
                        className="w-full h-32 object-cover group-hover:scale-105 transition"
                    />

                    <div className="p-2">
                        <p className="text-xs font-semibold text-white">
                            {template.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                            {template.width} × {template.height}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DesignLibrary;
