import React, { useEffect } from "react";
import usePresentationStore from "../../store/usePresentationStore";
import SlideThumbnail from "./SlideThumbnail";

const SlidesPanel = () => {
  const {
    slides,
    activeSlideId,
    setActiveSlide,
    addSlide,
    deleteSlide,
    duplicateSlide,
  } = usePresentationStore();

  // Ensure one slide is selected on first load
  useEffect(() => {
    if (!activeSlideId && slides.length > 0) {
      setActiveSlide(slides[0].id);
    }
  }, [activeSlideId, slides, setActiveSlide]);

  return (
    <div
      style={{
        width: "240px",
        flexShrink: 0,
        background: "#f8f9fa",
        borderRight: "1px solid #ddd",
        padding: "8px",
        overflowY: "auto",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          paddingBottom: "8px",
          borderBottom: "1px solid #e9ecef",
          fontWeight: "600",
          fontSize: "14px"
        }}
      >
        <span>Slides</span>
        <button
          onClick={addSlide}
          style={{
            width: "24px",
            height: "24px",
            border: "1px solid #ddd",
            background: "white",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold"
          }}
        >
          +
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto"
        }}
      >
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId;

          return (
            <div
              key={slide.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "6px",
                marginBottom: "12px",
                position: "relative",
              }}
            >
              {/* Slide Number (LEFT SIDE) */}
              <div
                style={{
                  width: "20px",
                  textAlign: "right",
                  fontSize: "12px",
                  color: "#6b7280",
                  userSelect: "none",
                  paddingTop: "6px",
                }}
              >
                {index + 1}
              </div>

              {/* Thumbnail + Controls */}
              <div style={{ position: "relative" }}>
                <SlideThumbnail
                  slide={slide}
                  isActive={isActive}
                  onClick={() => setActiveSlide(slide.id)}
                />

                {/* Overlay buttons */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    right: "6px",
                    display: "flex",
                    gap: "6px",
                    opacity: isActive ? 1 : 0.7,
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateSlide(slide.id);
                    }}
                    title="Duplicate slide"
                    style={iconBtn("#1a73e8")}
                  >
                    ⧉
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSlide(slide.id);
                    }}
                    title="Delete slide"
                    style={iconBtn("#dc3545")}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
};

export default SlidesPanel;

const iconBtn = (color) => ({
  width: "20px",
  height: "20px",
  border: "none",
  background: "rgba(255,255,255,0.9)",
  color,
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
});