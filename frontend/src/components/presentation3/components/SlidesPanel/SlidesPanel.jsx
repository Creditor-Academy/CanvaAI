import React, { useEffect } from "react";
import usePresentationStore from "../../store/usePresentationStore";

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
                borderRadius: "6px",
                padding: "4px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: isActive
                  ? "2px solid #1a73e8"
                  : "1px solid #ddd",
                background: isActive ? "#e3f2fd" : "white",
                boxShadow: isActive
                  ? "0 2px 8px rgba(26, 115, 232, 0.15)"
                  : "0 1px 3px rgba(0,0,0,0.1)"
              }}
              onClick={() => setActiveSlide(slide.id)}
            >
              <div
                style={{
                  width: "100%",
                  height: "120px",
                  borderRadius: "4px",
                  marginBottom: "6px",
                  background: slide.background || "#f0f0f0",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative",
                  overflow: "hidden"
                }}
              />
                <div style={{ display: "flex", gap: "6px" }}>
                  
                  {/* DUPLICATE */}
                  <span style={{ color: "#666" }}>{index + 1}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateSlide(slide.id);
                    }}
                    title="Duplicate slide"
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "none",
                      background: "rgba(26, 115, 232, 0.1)",
                      color: "#1a73e8",
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ⧉
                  </button>

                  {/* DELETE */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSlide(slide.id);
                    }}
                    title="Delete slide"
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "none",
                      background: "rgba(220, 53, 69, 0.1)",
                      color: "#dc3545",
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SlidesPanel;