import React from "react";
import TextLayer from "../../layers/TextLayer";
import ImageLayer from "../../layers/ImageLayer";
import TableLayer from "../../layers/TableLayer";
import ShapeRenderer from "../shapes/ShapeRenderer";

const THUMB_WIDTH = 140;
const THUMB_HEIGHT = 78.75;
const SCALE = THUMB_WIDTH / 960;

const SlideThumbnail = ({ slide, isActive, onClick }) => {
  // Compute background matching CanvasShell exactly
  const bgStyle = {
    backgroundColor: slide.background || "#ffffff",
    backgroundImage: slide.backgroundImage
      ? `url(${slide.backgroundImage})`
      : "none",
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  };

  // Handle CSS gradient backgrounds
  if (slide.backgroundType === "gradient" && slide.backgroundGradient?.colors?.length >= 2) {
    const g = slide.backgroundGradient;
    bgStyle.backgroundImage =
      g.type === "radial"
        ? `radial-gradient(${g.colors.join(", ")})`
        : `linear-gradient(${g.angle ?? 135}deg, ${g.colors.join(", ")})`;
  }

  return (
    <div
      onClick={onClick}
      className={`thumbnail ${isActive ? "active" : ""}`}
      style={bgStyle}
    >
      {/* Scale a full 960×540 canvas down to thumbnail size */}
      <div
        style={{
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
          width: 960,
          height: 540,
          position: "relative",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {slide.layers?.map((layer) => {
          // ── Text layer — mirror CanvasShell wrapper exactly ──────────────
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
                  padding: "6px",
                  border: "1px solid transparent",
                  boxSizing: "border-box",
                  overflow: "hidden",
                  transform: `rotate(${layer.rotation || 0}deg)`,
                  transformOrigin: "center center",
                }}
              >
                <TextLayer layer={layer} isEditing={false} />
              </div>
            );
          }

          // ── Image layer — mirror CanvasShell nested-div structure ────────
          if (layer.type === "image") {
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
                  borderRadius: layer.borderRadius || 0,
                  overflow: "hidden",
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
                  <ImageLayer layer={layer} />
                </div>
              </div>
            );
          }

          // ── Shape layer — matches ShapeLayer component positioning ───────
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
                  transformOrigin: "center",
                }}
              >
                <ShapeRenderer layer={layer} />
              </div>
            );
          }

          // ── Table layer — use TableLayer component (correct 6px cell padding) ──
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
                  boxSizing: "border-box",
                  transform: `rotate(${layer.rotation || 0}deg)`,
                  transformOrigin: "center center",
                }}
              >
                <TableLayer layer={layer} />
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