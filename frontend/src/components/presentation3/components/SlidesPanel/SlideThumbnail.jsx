import React from "react";


import { SlateStaticRenderer } from "../../editors/slate/slateRenderer";

const THUMB_WIDTH = 160;
const THUMB_HEIGHT = 90;
const SCALE = THUMB_WIDTH / 960;

const SlideThumbnail = ({ slide, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`thumbnail ${isActive ? "active" : ""}`}
      style={{
        backgroundColor: slide.background || "#ffffff",
        backgroundImage: slide.backgroundImage
          ? `url(${slide.backgroundImage})`
          : "none",
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
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
            const isPlaceholderVisible =
              !layer.hasBeenEdited && (!layer.content || (layer.content.length === 1 && layer.content[0].children[0].text === ""));

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
                  color: isPlaceholderVisible ? "#94a3b8" : layer.color,
                  fontFamily: layer.fontFamily,
                  fontWeight: layer.fontWeight,
                  fontStyle: layer.fontStyle,
                  textDecoration: layer.textDecoration,
                  textAlign: layer.textAlign,
                  overflow: "hidden",
                  whiteSpace: "pre-wrap",
                  transform: `rotate(${layer.rotation || 0}deg)`,
                  transformOrigin: "center center",
                  lineHeight: 1.2,
                }}
              >
                {isPlaceholderVisible ? (
                  <span>{layer.placeholder || "Add text..."}</span>
                ) : (
                  <SlateStaticRenderer value={layer.content} />
                )}
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
                  borderRadius: layer.borderRadius || 0,
                  border: `${layer.borderWidth || 0}px solid ${layer.borderColor || "#000"
                    }`,
                  boxSizing: "border-box",
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
                  height:
                    layer.shapeType === "line" ||
                      layer.shapeType === "arrow"
                      ? Math.max(2, layer.strokeWidth || 2)
                      : layer.height,
                  background: layer.fill,
                  borderRadius,
                  border:
                    layer.shapeType === "line" ||
                      layer.shapeType === "arrow"
                      ? `2px solid ${layer.stroke}`
                      : "none",
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
                  border: `${layer.borderWidth || 1}px solid ${layer.borderColor || "#e5e7eb"
                    }`,
                  backgroundColor: layer.tableBgColor || "transparent",
                  transform: `rotate(${layer.rotation || 0}deg)`,
                  transformOrigin: "center center",
                }}
              >
                {Array.from({
                  length: layer.rows * layer.cols,
                }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      border: `${layer.borderWidth || 1}px solid ${layer.borderColor || "#e5e7eb"
                        }`,
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