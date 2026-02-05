import React from "react";
import ShapeRenderer from "../components/shapes/ShapeRenderer";

const SlidePresenter = ({ slide, scale = 1 }) => {
    if (!slide) return null;

    return (
        <div
            style={{
                width: 960,
                height: 540,
                backgroundColor: slide.background,
                backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : "none",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                position: "relative",
                transform: `scale(${scale})`,
                transformOrigin: "center center",
                overflow: "hidden",
                boxShadow: "0 0 50px rgba(0,0,0,0.5)",
                flexShrink: 0,
            }}
        >
            {slide.layers.map((layer) => {
                const rotation = layer.rotation || 0;
                const commonStyle = {
                    position: "absolute",
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    height: layer.height,
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                    pointerEvents: "none", // Most layers are non-interactive in present mode
                    userSelect: "none",
                };

                if (layer.type === "text") {
                    return (
                        <div
                            key={layer.id}
                            style={{
                                ...commonStyle,
                                padding: "6px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-start",
                                fontSize: layer.fontSize,
                                color: layer.color,
                                fontFamily: layer.fontFamily,
                                fontWeight: layer.fontWeight,
                                fontStyle: layer.fontStyle,
                                textDecoration: layer.textDecoration,
                                textAlign: layer.textAlign,
                                wordBreak: "break-word",
                            }}
                        >
                            {layer.text}
                        </div>
                    );
                }

                if (layer.type === "shape") {
                    return (
                        <div key={layer.id} style={commonStyle}>
                            <ShapeRenderer layer={layer} />
                        </div>
                    );
                }

                if (layer.type === "image") {
                    return (
                        <div key={layer.id} style={commonStyle}>
                            <img
                                src={layer.src}
                                alt=""
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "fill",
                                    borderRadius: layer.borderRadius || 0,
                                    border: `${layer.borderWidth || 0}px solid ${layer.borderColor || '#000'}`,
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                    );
                }

                if (layer.type === "table") {
                    return (
                        <div key={layer.id} style={commonStyle}>
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "grid",
                                    gridTemplateColumns: `repeat(${layer.cols}, 1fr)`,
                                    gridTemplateRows: `repeat(${layer.rows}, 1fr)`,
                                    border: `${layer.borderWidth || 1}px solid ${layer.borderColor || "#e5e7eb"}`,
                                    backgroundColor: layer.tableBgColor || "transparent",
                                    boxSizing: "border-box",
                                }}
                            >
                                {layer.cells.map((row, r) =>
                                    row.map((cell, c) => (
                                        <div
                                            key={`${r}-${c}`}
                                            style={{
                                                border: `${layer.borderWidth || 1}px solid ${layer.borderColor || "#e5e7eb"}`,
                                                padding: "6px",
                                                fontSize: layer.fontSize || 14,
                                                color: layer.color || "#000000",
                                                fontWeight: layer.fontWeight || "normal",
                                                fontStyle: layer.fontStyle || "normal",
                                                textDecoration: layer.textDecoration || "none",
                                                textAlign: layer.textAlign || "center",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent:
                                                    layer.textAlign === "left"
                                                        ? "flex-start"
                                                        : layer.textAlign === "right"
                                                            ? "flex-end"
                                                            : "center",
                                                wordBreak: "break-word",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {cell}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
};

export default SlidePresenter;
