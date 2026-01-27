import React, { useState, useEffect } from "react";
import usePresentationStore from "../../store/usePresentationStore";
import ShapeLayer from "../../layers/ShapeLayer";
import TextLayer from "../../layers/TextLayer";

const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;
const HANDLE_SIZE = 8;

const CanvasShell = () => {
  const {
    slides,
    activeSlideId,
    updateTextLayer,
    updateLayerPosition,
    resizeTextBox,
    selectedLayerId,
    setSelectedLayer,
    clearSelection,
    deleteSelectedLayer,
  } = usePresentationStore();

  const activeSlide = slides.find(
    (slide) => slide.id === activeSlideId
  );

  const [draggingId, setDraggingId] = useState(null);
  const [resizingId, setResizingId] = useState(null);
  const [startSize, setStartSize] = useState({ w: 0, h: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });


  /* =========================
     DELETE KEY HANDLING
  ========================= */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (
        (e.key === "Delete") &&
        selectedLayerId
      ) {
        deleteSelectedLayer();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () =>
      window.removeEventListener("keydown", onKeyDown);
  }, [selectedLayerId, deleteSelectedLayer]);

  const handleMouseMove = (e) => {
    const slideRect = e.currentTarget.getBoundingClientRect();

    if (draggingId) {
      updateLayerPosition(
        draggingId,
        e.clientX - slideRect.left - offset.x,
        e.clientY - slideRect.top - offset.y
      );
    }

    if (resizingId) {
      resizeTextBox(
        resizingId,
        startSize.w + (e.clientX - startPos.x),
        startSize.h + (e.clientY - startPos.y)
      );
    }
  };

  const stopAll = () => {
    setDraggingId(null);
    setResizingId(null);
  };

  return (
    <div style={styles.wrapper}>
      <div
        style={{
          ...styles.slide,
          background: activeSlide.background,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={stopAll}
        onMouseLeave={stopAll}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            clearSelection();
          }
        }}
      >
        {activeSlide.layers.map((layer) => {
          if (layer.type !== "text") return null;
          const selected = selectedLayerId === layer.id;
          const Wrapper = layer.link ? "a" : "div";

            const isPlaceholderVisible =
    !layer.hasBeenEdited && (!layer.text || layer.text.trim() === "");


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
                border: selected
                  ? "1.5px solid #2563eb"
                  : "1px solid transparent",
                cursor: "move",
                userSelect: "none",
                boxSizing: "border-box",
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedLayer(layer.id);
                setDraggingId(layer.id);

                const rect =
                  e.currentTarget.getBoundingClientRect();
                setOffset({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                });
              }}
            >
              <Wrapper
  href={layer.link || undefined}
  target="_blank"
  rel="noopener noreferrer"
  contentEditable={!layer.link}
  suppressContentEditableWarning

  onFocus={(e) => {
  // Remove placeholder visually on focus (not stored)
  if (isPlaceholderVisible) {
    e.target.innerText = "";
  }
}}


     onBlur={(e) => {
  const value = e.target.innerText.trim();

  // 👇 IMPORTANT: restore placeholder in DOM
  if (value.length === 0) {
    e.target.innerText = layer.placeholder;
  }

  updateTextLayer(layer.id, {
    text: value,
    hasBeenEdited: value.length > 0,
  });
}}


  onClick={(e) => {
    if (!layer.link) e.preventDefault();
  }}

  style={{
    display: "block",
    width: "100%",
    height: "100%",
    fontSize: layer.fontSize,
    color: isPlaceholderVisible ? "#000000" : layer.color,
    fontFamily: layer.fontFamily,
    fontWeight: layer.fontWeight,
    fontStyle: layer.fontStyle,
    textDecoration: layer.textDecoration,
    textAlign: layer.textAlign,
    outline: "none",
    cursor: layer.link ? "pointer" : "text",
    userSelect: "text",
  }}
>
  {isPlaceholderVisible
    ? layer.placeholder
    : layer.text}
       </Wrapper>


              {selected && (
                <div
                  style={styles.resizeHandle}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setResizingId(layer.id);
                    setStartSize({
                      w: layer.width,
                      h: layer.height,
                    });
                    setStartPos({
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CanvasShell;

/* =========================
   STYLES
========================= */

const styles = {
  wrapper: {
    flex: 1,
    background: "#e5e7eb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  slide: {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    position: "relative",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
  },
  resizeHandle: {
    position: "absolute",
    right: -HANDLE_SIZE / 2,
    bottom: -HANDLE_SIZE / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    background: "#2563eb",
    cursor: "nwse-resize",
  },
};