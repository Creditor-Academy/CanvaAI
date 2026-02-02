import React, { useEffect, useState } from "react";
import usePresentationStore from "../../store/usePresentationStore";
import SlideThumbnail from "./SlideThumbnail";
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import '../../globals.css';

const SlidesPanel = () => {
  const {
    slides,
    activeSlideId,
    setActiveSlide,
    addSlide,
    deleteSlide,
    duplicateSlide,
  } = usePresentationStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Ensure one slide is selected on first load
  useEffect(() => {
    if (!activeSlideId && slides.length > 0) {
      setActiveSlide(slides[0].id);
    }
  }, [activeSlideId, slides, setActiveSlide]);

  return (
    <div
      style={{
        width: isCollapsed ? "60px" : "240px",
        height: "calc(100vh - 120px)", /* Floating height */
        position: 'absolute',
        top: '110px', /* Below top bar */
        left: '20px',
        background: "var(--editor-panel-bg)",
        borderRadius: "12px",
        boxShadow: "var(--shadow-floating)",
        padding: "12px",
        flexShrink: 0,
        zIndex: 40,
        transition: "width 0.3s ease",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: isCollapsed ? "center" : "space-between",
          alignItems: "center",
          marginBottom: "16px",
          paddingBottom: "8px",
          borderBottom: isCollapsed ? "none" : "1px solid var(--editor-border)",
        }}
      >
        {!isCollapsed && <span style={{ fontWeight: 600, color: 'var(--editor-text)' }}>Slides</span>}

        <div style={{ display: 'flex', gap: '4px' }}>
          {!isCollapsed && (
            <button
              onClick={addSlide}
              className="editor-btn-icon"
              title="Add Slide"
              style={{ width: '28px', height: '28px' }}
            >
              <Plus size={16} />
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="editor-btn-icon"
            title={isCollapsed ? "Expand" : "Collapse"}
            style={{ width: '28px', height: '28px' }}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      <div
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden", /* Hide horizontal scroll during transition */
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          paddingRight: "4px" // Space for scrollbar
        }}
      >
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId;

          return (
            <div
              key={slide.id}
              style={{
                display: "flex",
                flexDirection: isCollapsed ? "column" : "row",
                alignItems: isCollapsed ? "center" : "flex-start",
                gap: "8px",
                position: "relative",
              }}
            >
              {/* Slide Number */}
              <div
                style={{
                  width: isCollapsed ? "auto" : "20px",
                  textAlign: isCollapsed ? "center" : "right",
                  fontSize: "12px",
                  color: "#9ca3af",
                  userSelect: "none",
                  paddingTop: "6px",
                  marginBottom: isCollapsed ? "2px" : "0"
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
                  collapsed={isCollapsed}
                />

                {/* Overlay buttons - Only show if NOT collapsed */}
                {!isCollapsed && (
                  <div className="slide-actions-overlay">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSlide(slide.id);
                      }}
                      title="Duplicate"
                      className="slide-action-btn"
                    >
                      ⧉
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(slide.id);
                      }}
                      title="Delete"
                      className="slide-action-btn delete"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .slide-actions-overlay {
            position: absolute;
            bottom: 8px;
            right: 8px;
            display: flex;
            gap: 6px;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        /* Parent hover triggers overlay */
        div:hover > div > div > .slide-actions-overlay {
            opacity: 1;
        }

        .slide-action-btn {
            width: 24px;
            height: 24px;
            border: none;
            background: white;
            color: var(--editor-text-secondary);
            border-radius: 4px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }
        
        .slide-action-btn:hover {
            color: var(--editor-brand);
            background: #f8fafc;
        }

        .slide-action-btn.delete:hover {
            color: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default SlidesPanel;