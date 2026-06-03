import React from "react";
import { SlateStaticRenderer } from "../editors/slate/slateRenderer";
import ShapeRenderer from "../components/shapes/ShapeRenderer";
import ChartLayerRenderer from "../components/charts/ChartLayerRenderer";
import { SLIDE } from "../layout/constants";

const FALLBACK_SLATE = [{ type: "paragraph", children: [{ text: "" }] }];

const resolveCell = (rawCell) => {
    if (!rawCell) {
        return {
            content: FALLBACK_SLATE,
            fontFamily: "Arial",
            fontSize: 14,
            textAlign: "center",
            color: "#ffffff",
        };
    }
    if (typeof rawCell === "string") {
        return {
            content: [{ type: "paragraph", children: [{ text: rawCell }] }],
            fontFamily: "Arial",
            fontSize: 14,
            textAlign: "center",
            color: "#ffffff",
        };
    }
    const isSlateValid =
        Array.isArray(rawCell.content) &&
        rawCell.content[0]?.type &&
        Array.isArray(rawCell.content[0]?.children);
    return {
        content: isSlateValid ? rawCell.content : FALLBACK_SLATE,
        fontFamily: rawCell.fontFamily || "Arial",
        fontSize: rawCell.fontSize || 14,
        textAlign: rawCell.textAlign || "center",
        color: rawCell.color || "#ffffff",
    };
};

const SlidePresenter = ({ slide, scale }) => {
    if (!slide) return null;

    return (
        <div
            style={{
                width: SLIDE.WIDTH,
                height: SLIDE.HEIGHT,
                position: "relative",
                backgroundColor: slide.background || "#ffffff",
                backgroundImage: slide.backgroundImage
                    ? `url(${slide.backgroundImage})`
                    : "none",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                transform: `scale(${scale})`,
                transformOrigin: "center center",
                flexShrink: 0,
                overflow: "hidden",
            }}
        >
            {slide.layers?.map((layer) => {
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
                    const isHeading = layer.role === "heading" || layer.role === "title";
                    return (
                        <div
                            key={layer.id}
                            style={{
                                ...commonStyle,
                                padding: "6px",
                                boxSizing: "border-box",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    overflow: "hidden",
                                    fontFamily: layer.fontFamily,
                                    fontSize: `${layer.fontSize}px`,
                                    fontWeight: layer.fontWeight,
                                    textAlign: layer.textAlign,
                                    color: layer.color || "#334155",
                                    overflowWrap: "break-word",
                                    wordBreak: "break-word",
                                    whiteSpace: "normal",
                                    lineHeight: 1.4,
                                    ...(isHeading && { textTransform: "uppercase" }),
                                }}
                            >
                                <SlateStaticRenderer value={layer.content} />
                            </div>
                        </div>
                    );
                }

                if (layer.type === "image") {
                    return (
                        <div
                            key={layer.id}
                            style={{
                                ...commonStyle,
                                borderRadius: layer.borderRadius || 0,
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    position: "relative",
                                    overflow: "hidden",
                                    borderRadius: layer.borderRadius || 0,
                                    border: `${layer.borderWidth || 0}px solid ${layer.borderColor || "#000"}`,
                                    boxSizing: "border-box",
                                }}
                            >
                                <img
                                    src={layer.imageUrl || layer.src}
                                    alt=""
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            </div>
                        </div>
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
                    const rows = layer.rows || 0;
                    const cols = layer.cols || 0;
                    const borderWidth = layer.borderWidth || 1;
                    const borderColor = layer.borderColor || "#000000";
                    const safeGrid =
                        Array.isArray(layer.cells) && layer.cells.length === rows
                            ? layer.cells
                            : Array.from({ length: rows }, () =>
                                  Array.from({ length: cols }, () => null)
                              );

                    return (
                        <div key={layer.id} style={commonStyle}>
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "grid",
                                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                                    border: `${borderWidth}px solid ${borderColor}`,
                                    backgroundColor: layer.tableBgColor || "transparent",
                                    boxSizing: "border-box",
                                }}
                            >
                                {safeGrid.map((row, r) => {
                                    const safeRow = Array.isArray(row)
                                        ? row
                                        : Array.from({ length: cols }, () => null);
                                    return safeRow.map((rawCell, c) => {
                                        const cell = resolveCell(rawCell);
                                        return (
                                            <div
                                                key={`${r}-${c}`}
                                                style={{
                                                    border: `${borderWidth}px solid ${borderColor}`,
                                                    padding: "6px",
                                                    overflow: "hidden",
                                                    color: cell.color,
                                                    fontFamily: cell.fontFamily,
                                                    fontSize: `${cell.fontSize}px`,
                                                    textAlign: cell.textAlign,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                    wordBreak: "break-word",
                                                }}
                                            >
                                                <SlateStaticRenderer value={cell.content} />
                                            </div>
                                        );
                                    });
                                })}
                            </div>
                        </div>
                    );
                }

                if (layer.type === "chart") {
                    return (
                        <div
                            key={layer.id}
                            style={{
                                ...commonStyle,
                                overflow: "hidden",
                                borderRadius: layer.borderRadius || 8,
                            }}
                        >
                            <ChartLayerRenderer layer={layer} />
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
};

export default SlidePresenter;
