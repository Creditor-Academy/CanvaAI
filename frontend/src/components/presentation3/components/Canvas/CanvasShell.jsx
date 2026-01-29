import React, { useState, useEffect } from "react";
import usePresentationStore from "../../store/usePresentationStore";
import ShapeLayer from "../../layers/ShapeLayer";
import TextLayer from "../../layers/TextLayer";
import ImageLayer from "../../layers/ImageLayer";
import TableLayer from "../../layers/TableLayer";

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
    updateLayerRotation,
    saveToHistory,
    undo,
    redo,
  } = usePresentationStore();

  const activeSlide = slides.find(
    (slide) => slide.id === activeSlideId
  );

  const [draggingId, setDraggingId] = useState(null);
  const [resizingId, setResizingId] = useState(null);
  const [rotatingId, setRotatingId] = useState(null);
  const [startSize, setStartSize] = useState({ w: 0, h: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });


  /* =========================
     KEYBOARD SHORTCUTS (Undo/Redo/Delete)
  ========================= */
  useEffect(() => {
    const handler = (e) => {
      // Delete key
      if (e.key === "Delete" && selectedLayerId) {
        deleteSelectedLayer();
      }

      // Undo/Redo
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "z") {
          e.preventDefault();
          undo();
        }
        if (e.key === "y" || (e.shiftKey && e.key === "Z")) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedLayerId, deleteSelectedLayer, undo, redo]);

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

    if (rotatingId) {
      const layer = activeSlide.layers.find((l) => l.id === rotatingId);
      if (layer) {
        // Calculate center of layer
        const layerCenterX = (slideRect.left + layer.x) + layer.width / 2;
        const layerCenterY = (slideRect.top + layer.y) + layer.height / 2;

        const angle = Math.atan2(
          e.clientY - layerCenterY,
          e.clientX - layerCenterX
        ) * (180 / Math.PI);

        const rotation = angle + 90; // Adjust so handle at top is 0 (approx)

        updateLayerRotation(rotatingId, rotation);
      }
    }
  };

  const stopAll = () => {
    setDraggingId(null);
    setResizingId(null);
    setRotatingId(null);
  };

  if (!activeSlide) return null;

  return (
    <div style={styles.wrapper}>
      <div
        style={{
          ...styles.slide,
          backgroundColor: activeSlide.background,
          backgroundImage: activeSlide.backgroundImage
            ? `url(${activeSlide.backgroundImage})`
            : "none",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
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
          const selected = selectedLayerId === layer.id;

          if (layer.type === "shape") {
            return (
              <ShapeLayer
                key={layer.id}
                layer={layer}
                selected={selected}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  saveToHistory();
                  setSelectedLayer(layer.id);
                  setDraggingId(layer.id);

                  const rect = e.currentTarget.getBoundingClientRect();
                  setOffset({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                style={{
                  transform: `rotate(${layer.rotation || 0}deg)`,
                  transformOrigin: "center center",
                }}
              >
                {selected && (
                  <>
                    <div
                      style={styles.resizeHandle}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        saveToHistory();
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
                    <div
                      style={styles.rotateHandle}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        saveToHistory();
                        setRotatingId(layer.id);
                      }}
                    />
                  </>
                )}
              </ShapeLayer>
            );
          }

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
                  border: selected
                    ? "1.5px solid #2563eb"
                    : "none",
                  cursor: "move",
                  userSelect: "none",
                  transform: `rotate(${layer.rotation || 0}deg)`,
                  transformOrigin: "center center",
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  saveToHistory();
                  setSelectedLayer(layer.id);
                  setDraggingId(layer.id);

                  const rect = e.currentTarget.getBoundingClientRect();
                  setOffset({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
              >
                <div style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  pointerEvents: 'none',
                }}>
                  <ImageLayer layer={layer} />
                </div>
                {selected && (
                  <>
                    <div
                      style={styles.resizeHandle}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        saveToHistory();
                        setResizingId(layer.id);
                        setStartSize({
                          w: layer.width,
                          h: layer.height
                        });
                        setStartPos({
                          x: e.clientX,
                          y: e.clientY
                        });
                      }}
                    />
                    <div
                      style={styles.rotateHandle}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        saveToHistory();
                        setRotatingId(layer.id);
                      }}
                    />
                  </>
                )}
              </div>
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
                  border: selected ? "2px solid #2563eb" : "none",
                  boxSizing: "border-box",
                  transform: `rotate(${layer.rotation || 0}deg)`,
                  transformOrigin: "center center",
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  saveToHistory();
                  setSelectedLayer(layer.id);
                  setDraggingId(layer.id);

                  const rect = e.currentTarget.getBoundingClientRect();
                  setOffset({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
              >
                <TableLayer layer={layer} selected={selected} />
                {selected && (
                  <>
                    <div
                      style={styles.resizeHandle}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        saveToHistory();
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
                    <div
                      style={styles.rotateHandle}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        saveToHistory();
                        setRotatingId(layer.id);
                      }}
                    />
                  </>
                )}
              </div>
            );
          }

          if (layer.type !== "text") return null;
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
                transform: `rotate(${layer.rotation || 0}deg)`,
                transformOrigin: "center center",
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                saveToHistory();
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

                  // Optional: call saveToHistory here if text change is discrete
                  // Actually updateTextLayer in store will handle it if we put it there.
                  updateTextLayer(layer.id, {
                    text: value,
                    hasBeenEdited: value.length > 0,
                  });
                }}


                onClick={(e) => {
                  if (layer.link) {
                    // Force open in new window as requested
                    e.preventDefault();
                    window.open(layer.link, "_blank", "noopener,noreferrer");
                  } else {
                    e.preventDefault();
                  }
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
                <>
                  <div
                    style={styles.resizeHandle}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      saveToHistory();
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
                  <div
                    style={styles.rotateHandle}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      saveToHistory();
                      setRotatingId(layer.id);
                    }}
                  />
                </>
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
  rotateHandle: {
    position: "absolute",
    left: "50%",
    top: -24, // Place above the element
    width: 10,
    height: 10,
    marginLeft: -5,
    borderRadius: "50%",
    background: "#fff",
    border: "1px solid #2563eb",
    cursor: "grab",
    zIndex: 100,
  },
};