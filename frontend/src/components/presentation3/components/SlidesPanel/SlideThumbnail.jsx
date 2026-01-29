import React from "react";

const THUMB_WIDTH = 160;
const THUMB_HEIGHT = 90;
const SCALE = THUMB_WIDTH / 960; // same ratio as canvas

const SlideThumbnail = ({ slide, isActive, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                width: THUMB_WIDTH,
                height: THUMB_HEIGHT,
                border: isActive
                    ? "2px solid #2563eb"
                    : "1px solid #d1d5db",
                borderRadius: 4,
                backgroundColor: slide.background, // Fixed to use backgroundColor explicitly like in CanvasShell
                backgroundImage: slide.backgroundImage
                    ? `url(${slide.backgroundImage})`
                    : "none",
                backgroundSize: "100% 100%", // Fixed to match CanvasShell
                backgroundRepeat: "no-repeat", // Fixed to match CanvasShell
                backgroundPosition: "center",
                marginBottom: 12,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                boxSizing: "content-box", // Ensure border doesn't eat into size if needed, or default
            }}
        >
            {/* Layers Preview */}
            <div
                style={{
                    transform: `scale(${SCALE})`,
                    transformOrigin: "top left",
                    width: 960,
                    height: 540,
                    position: "relative",
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
                        // Basic shape preview (rect only for now as per snippet)
                        // If we want to support other shapes better in thumbnail without full renderer:
                        let borderRadius = "0px";
                        if (layer.shapeType === "roundRect") borderRadius = "12px";
                        if (layer.shapeType === "circle") borderRadius = "50%";

                        // For lines/arrows, this div approach won't work well (invisible if no fill).
                        // But following user snippet for now.

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
                                        : "none", // Simple fallback for lines
                                    height: (layer.shapeType === "line" || layer.shapeType === "arrow")
                                        ? Math.max(2, layer.strokeWidth || 2) // Ensure lines are visible
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
        </div>
    );
};

export default SlideThumbnail;
