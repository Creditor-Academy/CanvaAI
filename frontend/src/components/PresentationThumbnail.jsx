import React from "react";

/**
 * Self-contained thumbnail renderer for a single slide.
 * Renders the slide's background + layers (text, image, table, shape)
 * scaled down from the 960×540 canvas to fit inside a small card.
 */

const CANVAS_W = 960;
const CANVAS_H = 540;

/* ─── Minimal Slate static renderer (self-contained) ─── */

const renderLeaf = (leaf, i) => {
    const style = {
        fontWeight: leaf.bold ? "bold" : "normal",
        fontStyle: leaf.italic ? "italic" : "normal",
        textDecoration: leaf.underline ? "underline" : "none",
        fontSize: leaf.fontSize ? `${leaf.fontSize}px` : "inherit",
        color: leaf.color || "inherit",
        fontFamily: leaf.fontFamily || "inherit",
    };
    return (
        <span key={i} style={style}>
            {leaf.text || "\u00A0"}
        </span>
    );
};

const renderNode = (node, i) => {
    if (node.text !== undefined) return renderLeaf(node, i);

    const children = node.children?.map((child, ci) => renderNode(child, ci));
    const style = { textAlign: node.textAlign || "inherit", margin: 0 };

    switch (node.type) {
        case "bulleted-list":
            return (
                <ul key={i} style={{ ...style, listStyleType: "disc", marginLeft: 20 }}>
                    {children}
                </ul>
            );
        case "numbered-list":
            return (
                <ol key={i} style={{ ...style, listStyleType: "decimal", marginLeft: 20 }}>
                    {children}
                </ol>
            );
        case "list-item":
            return (
                <li key={i} style={style}>
                    {children}
                </li>
            );
        default:
            return (
                <p key={i} style={style}>
                    {children && children.length > 0 ? children : <br />}
                </p>
            );
    }
};

const MiniSlateRenderer = ({ value }) => {
    if (!value || !Array.isArray(value)) return null;
    return <>{value.map((node, i) => renderNode(node, i))}</>;
};

/* ─── Layer renderers ─── */

const TextLayer = ({ layer }) => (
    <div
        style={{
            position: "absolute",
            left: layer.x,
            top: layer.y,
            width: layer.width,
            height: layer.height,
            transform: `rotate(${layer.rotation || 0}deg)`,
            transformOrigin: "center center",
            overflow: "hidden",
            fontSize: layer.fontSize || 16,
            fontFamily: layer.fontFamily || "Arial",
            color: layer.color || "#000",
            textAlign: layer.textAlign || "left",
        }}
    >
        <MiniSlateRenderer value={layer.content} />
    </div>
);

const ImageLayer = ({ layer }) => (
    <img
        src={layer.imageUrl || layer.src}
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
            borderRadius: layer.borderRadius || 0,
            border: `${layer.borderWidth || 0}px solid ${layer.borderColor || "#000"}`,
            boxSizing: "border-box",
        }}
    />
);

const TableLayer = ({ layer }) => {
    const EMPTY = [{ type: "paragraph", children: [{ text: "" }] }];
    return (
        <div
            style={{
                position: "absolute",
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                display: "grid",
                gridTemplateColumns: `repeat(${layer.cols}, 1fr)`,
                gridTemplateRows: `repeat(${layer.rows}, 1fr)`,
                border: `${layer.borderWidth || 1}px solid ${layer.borderColor || "#e5e7eb"}`,
                backgroundColor: layer.tableBgColor || "transparent",
                transform: `rotate(${layer.rotation || 0}deg)`,
                transformOrigin: "center center",
            }}
        >
            {layer.cells?.map((row, r) =>
                row.map((cell, c) => (
                    <div
                        key={`${r}-${c}`}
                        style={{
                            border: `${layer.borderWidth || 1}px solid ${layer.borderColor || "#e5e7eb"}`,
                            padding: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                                cell?.textAlign === "left"
                                    ? "flex-start"
                                    : cell?.textAlign === "right"
                                        ? "flex-end"
                                        : "center",
                            overflow: "hidden",
                            color: cell?.color || layer.color || "#000",
                            fontSize: cell?.fontSize || layer.fontSize || 14,
                            fontFamily: cell?.fontFamily || layer.fontFamily || "Arial",
                        }}
                    >
                        <MiniSlateRenderer value={cell?.content || EMPTY} />
                    </div>
                ))
            )}
        </div>
    );
};

const ShapeLayer = ({ layer }) => {
    // Simplified shape rendering — renders a colored div with border-radius for basic shapes
    const shapeStyle = {
        position: "absolute",
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        transform: `rotate(${layer.rotation || 0}deg)`,
        transformOrigin: "center center",
        backgroundColor: layer.fill || layer.backgroundColor || "transparent",
        border: `${layer.strokeWidth || 0}px solid ${layer.stroke || "transparent"}`,
        borderRadius:
            layer.shapeType === "circle" || layer.shapeType === "ellipse"
                ? "50%"
                : layer.borderRadius || 0,
    };
    return <div style={shapeStyle} />;
};

/* ─── Main Component ─── */

const PresentationThumbnail = ({ slide, width = "100%", height = "100%" }) => {
    if (!slide) return null;

    return (
        <div
            style={{
                width,
                height,
                overflow: "hidden",
                position: "relative",
                backgroundColor: slide.background || "#ffffff",
                backgroundImage: slide.backgroundImage
                    ? `url(${slide.backgroundImage})`
                    : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: CANVAS_W,
                    height: CANVAS_H,
                    transform: `scale(${1 / (CANVAS_W / 260)})`, // ~260px target width
                    transformOrigin: "top left",
                    pointerEvents: "none",
                }}
            >
                {slide.layers?.map((layer) => {
                    switch (layer.type) {
                        case "text":
                            return <TextLayer key={layer.id} layer={layer} />;
                        case "image":
                            return <ImageLayer key={layer.id} layer={layer} />;
                        case "table":
                            return <TableLayer key={layer.id} layer={layer} />;
                        case "shape":
                            return <ShapeLayer key={layer.id} layer={layer} />;
                        default:
                            return null;
                    }
                })}
            </div>
        </div>
    );
};

export default PresentationThumbnail;
