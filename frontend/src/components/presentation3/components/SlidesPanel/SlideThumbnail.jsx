import React from "react";

const BASE_WIDTH = 160;
const BASE_HEIGHT = 90;
const COLLAPSED_WIDTH = 40;
const COLLAPSED_HEIGHT = 22.5; // Maintain aspect ratio roughly

const SlideThumbnail = ({ slide, isActive, onClick, collapsed }) => {
    const width = collapsed ? COLLAPSED_WIDTH : BASE_WIDTH;
    const height = collapsed ? COLLAPSED_HEIGHT : BASE_HEIGHT;
    const scale = width / 960;

    return (
        <div
            onClick={onClick}
            style={{
                width: width,
                height: height,
                border: isActive
                    ? "2px solid var(--editor-brand)"
                    : "1px solid transparent", // Cleaner default
                borderRadius: 6,
                backgroundColor: slide.background,
                backgroundImage: slide.backgroundImage
                    ? `url(${slide.backgroundImage})`
                    : "none",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                marginBottom: 0, /* Managed by parent gap */
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                boxSizing: "border-box", // Important for border to be inside
                boxShadow: isActive ? "0 0 0 2px rgba(37, 99, 235, 0.2)" : "0 1px 3px rgba(0,0,0,0.1)",
                transition: "all 0.2s ease"
            }}
        >
            {/* Layers Preview - Hide content when collapsed for performance/cleanliness if very small */}
            {!collapsed && (
                <div
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: "top left",
                        width: 960,
                        height: 540,
                        position: "relative",
                        pointerEvents: "none" // Ensure clicks pass through to container
                    }}
                >
                    {slide.layers.map((layer) => {
                        if (layer.type === "text") {
                            return (
                                <div
                                    key={layer.id}
                                    style={{
                                        position: "absolute",
                                        left: layer.x,
                                        top: layer.y,
                                        width: layer.width,
                                        height: layer.height,
                                        fontSize: layer.fontSize,
                                        color: layer.color,
                                        fontFamily: layer.fontFamily,
                                        fontWeight: layer.fontWeight,
                                        fontStyle: layer.fontStyle,
                                        textDecoration: layer.textDecoration,
                                        textAlign: layer.textAlign,
                                        overflow: "hidden",
                                        whiteSpace: "pre-wrap",
                                        transform: `rotate(${layer.rotation || 0}deg)`,
                                        transformOrigin: "center center",
                                    }}
                                >
                                    {layer.text || layer.placeholder}
                                </div>
                            );
                        }

                        if (layer.type === "image") {
                            return (
                                <img
                                    key={layer.id}
                                    src={layer.src}
                                    alt=""
                                    style={{
                                        position: "absolute",
                                        left: layer.x,
                                        top: layer.y,
                                        width: layer.width,
                                        height: layer.height,
                                        objectFit: "fill",
                                        transform: `rotate(${layer.rotation || 0}deg)`,
                                        transformOrigin: "center center",
                                    }}
                                />
                            );
                        }

                        if (layer.type === "shape") {
                            let borderRadius = "0px";
                            if (layer.shapeType === "roundRect") borderRadius = "12px";
                            if (layer.shapeType === "circle") borderRadius = "50%";

                            return (
                                <div
                                    key={layer.id}
                                    style={{
                                        position: "absolute",
                                        left: layer.x,
                                        top: layer.y,
                                        width: layer.width,

                                        background: layer.fill,
                                        borderRadius: borderRadius,
                                        border: (layer.shapeType === "line" || layer.shapeType === "arrow")
                                            ? `2px solid ${layer.stroke}`
                                            : "none",
                                        height: (layer.shapeType === "line" || layer.shapeType === "arrow")
                                            ? Math.max(2, layer.strokeWidth || 2)
                                            : layer.height,
                                        transform: `rotate(${layer.rotation || 0}deg)`,
                                        transformOrigin: "center center",
                                    }}
                                />
                            );
                        }

                        if (layer.type === "table") {
                            return (
                                <div
                                    key={layer.id}
                                    style={{
                                        position: "absolute",
                                        left: layer.x,
                                        top: layer.y,
                                        width: layer.width,
                                        height: layer.height,
                                        display: "grid",
                                        gridTemplateColumns: `repeat(${layer.cols}, 1fr)`,
                                        gridTemplateRows: `repeat(${layer.rows}, 1fr)`,
                                        border: `1px solid ${layer.borderColor || "#d1d5db"}`,
                                        background: "#fff",
                                        transform: `rotate(${layer.rotation || 0}deg)`,
                                        transformOrigin: "center center",
                                    }}
                                >
                                    {Array.from({ length: layer.rows * layer.cols }).map((_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                border: "1px solid #e5e7eb",
                                            }}
                                        />
                                    ))}
                                </div>
                            );
                        }

                        return null;
                    })}
                </div>
            )}
        </div>
    );
};

export default SlideThumbnail;
