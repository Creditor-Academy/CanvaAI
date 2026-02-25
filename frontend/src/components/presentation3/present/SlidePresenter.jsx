import React, { useState, useEffect } from "react";
import { SlateStaticRenderer } from "../editors/slate/slateRenderer";
import ShapeRenderer from "../components/shapes/ShapeRenderer";

const SlidePresenter = ({ slide, onClose }) => {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            const s = Math.min(window.innerWidth / 960, window.innerHeight / 540);
            setScale(s);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    if (!slide) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "#000000",
                zIndex: 2000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            <button
                onClick={onClose}
                style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    background: "rgba(0,0,0,0.4)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    zIndex: 2001,
                }}
            >
                Close (Esc)
            </button>

            <div
                style={{
                    width: 960,
                    height: 540,
                    position: "relative",
                    backgroundColor: slide.background || "#ffffff",
                    backgroundImage: slide.backgroundImage
                        ? `url(${slide.backgroundImage})`
                        : "none",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    boxShadow: "0 0 20px rgba(0,0,0,0.5)",
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                    flexShrink: 0,
                }}
            >
                {slide.layers.map((layer) => {
                    const commonStyle = {
                        position: "absolute",
                        left: layer.x,
                        top: layer.y,
                        width: layer.width,
                        height: layer.height,
                        transform: `rotate(${layer.rotation || 0}deg)`,
                        transformOrigin: "center center",
                    };

                    if (layer.type === "text") {
                        return (
                            <div
                                key={layer.id}
                                style={{
                                    ...commonStyle,
                                    fontSize: layer.fontSize,
                                    color: layer.color,
                                    fontFamily: layer.fontFamily,
                                    fontWeight: layer.fontWeight,
                                    fontStyle: layer.fontStyle,
                                    textDecoration: layer.textDecoration,
                                    textAlign: layer.textAlign,
                                    whiteSpace: "pre-wrap",
                                    lineHeight: 1.2,
                                }}
                            >
                                <SlateStaticRenderer value={layer.content} />
                            </div>
                        );
                    }

                    if (layer.type === "image") {
                        return (
                            <img
                                key={layer.id}
                                src={layer.imageUrl || layer.src}
                                alt=""
                                style={{
                                    ...commonStyle,
                                    objectFit: "fill",
                                    borderRadius: layer.borderRadius || 0,
                                    border: `${layer.borderWidth || 0}px solid ${layer.borderColor || "#000"}`,
                                    boxSizing: "border-box",
                                }}
                            />
                        );
                    }

                    if (layer.type === "shape") {
                        return (
                            <div
                                key={layer.id}
                                style={commonStyle}
                            >
                                <ShapeRenderer layer={layer} />
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
                                    {layer.cells?.map((row, r) =>
                                        row.map((cell, c) => {
                                            const DEFAULT_EMPTY_SLATE_VALUE = [{ type: "paragraph", children: [{ text: "" }] }];
                                            return (
                                                <div
                                                    key={`${r}-${c}`}
                                                    style={{
                                                        border: `${layer.borderWidth || 1}px solid ${layer.borderColor || "#e5e7eb"}`,
                                                        padding: "6px",
                                                        fontSize: cell?.fontSize || layer.fontSize || 14,
                                                        color: cell?.color || layer.color || "#ffffff",
                                                        fontWeight: cell?.fontWeight || layer.fontWeight || "normal",
                                                        fontStyle: cell?.fontStyle || layer.fontStyle || "normal",
                                                        textDecoration: cell?.textDecoration || layer.textDecoration || "none",
                                                        textAlign: cell?.textAlign || layer.textAlign || "center",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            (cell?.textAlign || layer.textAlign) === "left"
                                                                ? "flex-start"
                                                                : (cell?.textAlign || layer.textAlign) === "right"
                                                                    ? "flex-end"
                                                                    : "center",
                                                        wordBreak: "break-word",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <SlateStaticRenderer value={cell?.content || DEFAULT_EMPTY_SLATE_VALUE} />
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return null;
                })}
            </div>
        </div>
    );
};

export default SlidePresenter;
