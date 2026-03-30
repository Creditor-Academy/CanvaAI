import React, { useEffect, useState } from "react";
import usePresentationStore from "../../store/usePresentationStore";
import SlideThumbnail from "./SlideThumbnail";
import DraggableSlide from "./DraggableSlide";
import CustomDragLayer from "./CustomDragLayer";
import "./slides-panel.css";

const SlidesPanel = () => {
  const {
    slides,
    activeSlideId,
    setActiveSlide,
    addSlide,
    deleteSlide,
    duplicateSlide,
  } = usePresentationStore();

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!activeSlideId && slides.length > 0) {
      setActiveSlide(slides[0].id);
    }
  }, [activeSlideId, slides, setActiveSlide]);

  return (
    <div className={`slides-panel ${collapsed ? "collapsed" : ""}`}>
      <CustomDragLayer />

      {/* Collapse Toggle */}
      <button
        className="collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {!collapsed && (
        <>
          <div className="slides-header">
            <span className="slides-title">Slides</span>
            <button className="add-slide-btn" onClick={addSlide}>
              +
            </button>
          </div>

          <div className="slides-list">
            {slides.map((slide, index) => {
              const isActive = slide.id === activeSlideId;
              return (
                <DraggableSlide
                  key={slide.id || index}
                  slide={slide}
                  index={index}
                  isActive={isActive}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SlidesPanel;