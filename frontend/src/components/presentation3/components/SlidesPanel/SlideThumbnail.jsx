import React from "react";


import { SlateStaticRenderer } from "../../editors/slate/slateRenderer";
import ShapeRenderer from "../shapes/ShapeRenderer";

const THUMB_WIDTH = 140;
const THUMB_HEIGHT = 78.75;
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
          overflow: "hidden",
        }}
      >
        {slide.layers?.map((layer) => {
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
                  transform: `rotate(${layer.rotation || 0}deg)`,
                  transformOrigin: "center center",
                  display: 'flex',
                  // Allows vertical alignment if needed, defaults to top
                  alignItems: 'flex-start',
                  //textAlign is handled by Slate nodes
                  justifyContent: 'flex-start',
                  overflow: "hidden",
                  fontFamily: layer.fontFamily,
                  fontSize: `${layer.fontSize || 16}px`,
                  color: layer.color || "#ffffff",
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  whiteSpace: "normal",
                }}
              >
                <SlateStaticRenderer value={layer.content} style={{ textAlign: layer.textAlign }} />
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
            return (
              <div
                key={layer.id}
                style={{
                  position: "absolute",
                  left: layer.x,
                  top: layer.y,
                  width: layer.width,
                  height: layer.height,
                  transform: `rotate(${layer.rotation || 0}deg)`,
                  transformOrigin: "center center",
                }}
              >
                <ShapeRenderer layer={layer} />
              </div>
            );
          }

          if (layer.type === "table") {
            const DEFAULT_EMPTY_SLATE_VALUE = [{ type: "paragraph", children: [{ text: "" }] }];
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
                        padding: "1px", // Minimal padding for thumbnails
                        display: "flex",
                        alignItems: "center",
                        justifyContent: cell?.textAlign === "left" ? "flex-start" : cell?.textAlign === "right" ? "flex-end" : "center",
                        overflow: "hidden",
                        color: cell?.color || layer.color || "#ffffff"
                      }}
                    >
                      <SlateStaticRenderer value={cell?.content || DEFAULT_EMPTY_SLATE_VALUE} />
                    </div>
                  ))
                )}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

export default React.memo(SlideThumbnail);