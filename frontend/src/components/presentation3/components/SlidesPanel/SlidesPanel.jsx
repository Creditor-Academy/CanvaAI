import React, { useEffect, useState } from "react";
import usePresentationStore from "../../store/usePresentationStore";
import SlideThumbnail from "./SlideThumbnail";
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
                <div key={slide.id || index} className="slide-row">
                  <div className="slide-number">
                    {index + 1}
                  </div>

                  <div className="slide-thumbnail-wrapper">
                    <SlideThumbnail
                      slide={slide}
                      isActive={isActive}
                      onClick={() => setActiveSlide(slide.id)}
                    />

                    <div className="slide-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSlide(slide.id);
                        }}
                        className="duplicate-btn"
                      >
                        ⧉
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSlide(slide.id);
                        }}
                        className="delete-btn"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SlidesPanel;