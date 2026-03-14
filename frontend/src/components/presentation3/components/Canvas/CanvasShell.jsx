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
    canvasZoom,
    editingLayerId,
    setEditingLayer,
    clearEditingLayer,
    migrateTextLayers,
    editingCell,
    setEditingCell,
  } = usePresentationStore();

  /* =========================
     MIGRATION (Legacy text -> Slate JSON)
  ========================= */
  useEffect(() => {
    migrateTextLayers();
  }, [migrateTextLayers]);

  const activeSlide = slides.find(
    (slide) => slide.id === activeSlideId
  );

  const [draggingId, setDraggingId] = useState(null);
  const [resizingId, setResizingId] = useState(null);
  const [rotatingId, setRotatingId] = useState(null);
  const [startSize, setStartSize] = useState({ w: 0, h: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Position Readout & Smart Guides
  const [dragCoords, setDragCoords] = useState(null);
  const [activeGuides, setActiveGuides] = useState([]);


  /* =========================
     KEYBOARD SHORTCUTS (Undo/Redo/Delete)
  ========================= */
  useEffect(() => {
    const handler = (e) => {
      // If we're editing text, let Slate handle keyboard shortcuts
      if (editingLayerId) return;

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
  }, [selectedLayerId, editingLayerId, deleteSelectedLayer, undo, redo]);

  const handleMouseMove = (e) => {
    const slideRect = e.currentTarget.getBoundingClientRect();

    if (draggingId) {
      const scale = (slideRect.width / SLIDE_WIDTH); // This scale includes canvasZoom
      // Actually, slideRect.width is the VISUAL width, which is SLIDE_WIDTH * autoScale * canvasZoom
      // But we just need the ratio of screen pixels to slide pixels.
      const totalScale = scale;

      const mouseXRatio = (e.clientX - slideRect.left - offset.x) / totalScale;
      const mouseYRatio = (e.clientY - slideRect.top - offset.y) / totalScale;

      const layer = activeSlide.layers?.find(l => l.id === draggingId);
      if (!layer) return;

      let newX = mouseXRatio;
      let newY = mouseYRatio;

      // Smart Guides & Snapping Logic
      const guides = [];
      const threshold = 5 / scale; // Snap within 5 display pixels

      const snapX = (targetX, guidePos) => {
        if (Math.abs(newX - targetX) < threshold) {
          newX = targetX;
          guides.push({ type: 'v', x: guidePos });
          return true;
        }
        return false;
      };

      const snapY = (targetY, guidePos) => {
        if (Math.abs(newY - targetY) < threshold) {
          newY = targetY;
          guides.push({ type: 'h', y: guidePos });
          return true;
        }
        return false;
      };

      // 1. Snap to Slide Center
      snapX(SLIDE_WIDTH / 2 - layer.width / 2, SLIDE_WIDTH / 2);
      snapY(SLIDE_HEIGHT / 2 - layer.height / 2, SLIDE_HEIGHT / 2);

      // 2. Snap to other layers
      activeSlide.layers?.forEach(other => {
        if (other.id === draggingId) return;

        // X alignments
        snapX(other.x, other.x); // Left to Left
        snapX(other.x + other.width, other.x + other.width); // Left to Right
        snapX(other.x - layer.width, other.x); // Right to Left
        snapX(other.x + other.width - layer.width, other.x + other.width); // Right to Right
        snapX(other.x + other.width / 2 - layer.width / 2, other.x + other.width / 2); // Center X

        // Y alignments
        snapY(other.y, other.y); // Top to Top
        snapY(other.y + other.height, other.y + other.height); // Top to Bottom
        snapY(other.y - layer.height, other.y); // Bottom to Top
        snapY(other.y + other.height - layer.height, other.y + other.height); // Bottom to Bottom
        snapY(other.y + other.height / 2 - layer.height / 2, other.y + other.height / 2); // Center Y
      });

      updateLayerPosition(draggingId, newX, newY);
      setDragCoords({ x: Math.round(newX), y: Math.round(newY) });
      setActiveGuides(guides);
    }

    if (resizingId) {
      const scale = slideRect.width / SLIDE_WIDTH;
      resizeTextBox(
        resizingId,
        startSize.w + (e.clientX - startPos.x) / scale,
        startSize.h + (e.clientY - startPos.y) / scale
      );
    }

    if (rotatingId) {
      const scale = slideRect.width / SLIDE_WIDTH;
      const layer = activeSlide.layers?.find((l) => l.id === rotatingId);
      if (layer) {
        // Calculate center of layer in SCREEN pixels
        const layerCenterX = slideRect.left + (layer.x + layer.width / 2) * scale;
        const layerCenterY = slideRect.top + (layer.y + layer.height / 2) * scale;

        const angle = Math.atan2(
          e.clientY - layerCenterY,
          e.clientX - layerCenterX
        ) * (180 / Math.PI);

        updateLayerRotation(rotatingId, angle + 90); // +90 because handle is at the top
      }
    }
  };

  const stopAll = () => {
    setDraggingId(null);
    setResizingId(null);
    setRotatingId(null);
    setDragCoords(null);
    setActiveGuides([]);
  };

  if (!activeSlide) return null;

  return (
    <div style={styles.canvasWrapper}>
      <div style={styles.editorCenter}>
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
            transform: `scale(${canvasZoom})`,
            transformOrigin: "center center",
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={stopAll}
          onMouseLeave={stopAll}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              clearSelection();
              if (editingLayerId || editingCell) {
                saveToHistory();
                clearEditingLayer();
                setEditingCell(null);
              }
            }
          }}
        >
          {activeSlide.layers?.map((layer) => {
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
                    borderRadius: layer.borderRadius || 0,
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
                    overflow: 'hidden',
                    borderRadius: layer.borderRadius || 0,
                    border: `${layer.borderWidth || 0}px solid ${layer.borderColor || '#000'}`,
                    boxSizing: 'border-box',
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
                    // Prevent dragging if a cell is being edited
                    if (editingCell && editingCell.tableId === layer.id) return;

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

            const isEditing = editingLayerId === layer.id;

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
                  border:
                    selected && !isEditing
                      ? "1.5px solid #2563eb"
                      : "1px solid transparent",
                  cursor: isEditing ? "text" : "move",
                  userSelect: isEditing ? "text" : "none",
                  boxSizing: "border-box",
                  transform: `rotate(${layer.rotation || 0}deg)`,
                  transformOrigin: "center center",
                }}
                onMouseDown={(e) => {
                  if (isEditing) return;
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
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (!isEditing) {
                    saveToHistory();
                    setEditingLayer(layer.id);
                  }
                }}
              >
                <TextLayer layer={layer} isEditing={isEditing} />

                {selected && !isEditing && (
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

          {/* Smart Guides Rendering */}
          {activeGuides.map((guide, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: guide.type === 'v' ? guide.x : 0,
                top: guide.type === 'h' ? guide.y : 0,
                width: guide.type === 'v' ? 1 : SLIDE_WIDTH,
                height: guide.type === 'h' ? 1 : SLIDE_HEIGHT,
                borderLeft: guide.type === 'v' ? '1px dashed #ff00ff' : 'none',
                borderTop: guide.type === 'h' ? '1px dashed #ff00ff' : 'none',
                pointerEvents: "none",
                zIndex: 999,
              }}
            />
          ))}

          {/* Position Readout Tooltip */}
          {dragCoords && (
            <div style={{
              position: 'absolute',
              left: dragCoords.x,
              top: dragCoords.y - 30,
              background: 'rgba(37, 99, 235, 0.9)', // Using a more theme-consistent blue
              color: '#fff',
              padding: '2px 6px',
              borderRadius: '2px',
              fontSize: '11px',
              pointerEvents: 'none',
              zIndex: 1000,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              {dragCoords.x}, {dragCoords.y}
            </div>
          )}

          {/* Link Popup Tooltip */}
          {(() => {
            if (!selectedLayerId || draggingId || resizingId || rotatingId || editingLayerId) return null;
            const sLayer = activeSlide.layers?.find(l => l.id === selectedLayerId);
            if (!sLayer || !sLayer.link) return null;

            return (
              <div
                style={{
                  position: "absolute",
                  left: sLayer.x,
                  top: sLayer.y + sLayer.height + 14,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  zIndex: 1000,
                  cursor: "default",
                }}
                onMouseDown={(e) => e.stopPropagation()} // Prevent deselection
              >
                <a
                  href={sLayer.link.startsWith("http") ? sLayer.link : `https://${sLayer.link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#0c4a6e",
                    textDecoration: "underline",
                    fontSize: "14px",
                    fontWeight: 500,
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  onMouseOver={(e) => e.target.style.color = "#f59e0b"}
                  onMouseOut={(e) => e.target.style.color = "#0c4a6e"}
                >
                  {sLayer.link}
                </a>
                <div style={{ width: "1px", height: "16px", background: "#cbd5e1" }} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (sLayer.type === "text" || sLayer.type === "shape") {
                      setEditingLayer(sLayer.id);
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#0c4a6e",
                    cursor: "pointer",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    fontWeight: 600,
                    borderRadius: "4px",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => e.target.style.background = "#f1f5f9"}
                  onMouseOut={(e) => e.target.style.background = "transparent"}
                >
                  ✎ Edit Text
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTextLayer(sLayer.id, { link: "" });
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#e11d48",
                    cursor: "pointer",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 8px",
                    fontWeight: 600,
                    borderRadius: "4px",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => e.target.style.background = "#fff1f2"}
                  onMouseOut={(e) => e.target.style.background = "transparent"}
                  title="Remove Link"
                >
                  ✕ Remove
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default CanvasShell;

/* =========================
   STYLES
========================= */

const styles = {
  canvasWrapper: {
    flex: 1,
    background: "#f3f4f6", // Subtle grey, as requested
    padding: "79px 48px",  // Increased top padding to move content down
    overflow: "auto",      // Handle scrolling if needed
    display: "flex",       // To allow centering the editor-center
    flexDirection: "column",
  },
  editorCenter: {
    maxWidth: 1400,        // Design max width
    width: "100%",         // Take up available space up to max
    margin: "0 auto",      // Center horizontally
    display: "flex",
    justifyContent: "center",
    // alignItems: "center", // Optional: if we want vertical centering when zoomed out highly
    minHeight: "min-content", // Ensure it can grow
  },
  slide: {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    position: "relative",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    flexShrink: 0, // Prevent slide from shrinking
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