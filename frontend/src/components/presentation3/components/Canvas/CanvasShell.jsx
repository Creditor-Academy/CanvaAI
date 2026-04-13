import React, { useState, useEffect, useRef, useCallback } from "react";
import usePresentationStore, { isAIGeneratedSlide, clearAIGeneratedSlide } from "../../store/usePresentationStore";
import ShapeLayer from "../../layers/ShapeLayer";
import TextLayer from "../../layers/TextLayer";
import ImageLayer from "../../layers/ImageLayer";
import TableLayer from "../../layers/TableLayer";
import "./canvas.css";

const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;
const HANDLE_SIZE = 8;
const STACK_START_Y = 2;
const STACK_GAP = 1.5;

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
  const layerRefs = useRef({});
  const isApplyingAutoStackRef = useRef(false);
  const manualLayoutLocksRef = useRef({});
  const dragStartedRef = useRef(false);
  // Ref to the slide div so document-level handlers can read its rect.
  const slideRef = useRef(null);
  // Always-current snapshot of drag state — avoids stale closures in the
  // document-level handler which is mounted once with empty deps.
  const dragContextRef = useRef({});
  // Always-current stopAll so the document handler always calls the latest version.
  const stopAllRef = useRef(null);

  const getLockedSetForSlide = useCallback((slideId) => {
    if (!slideId) return new Set();
    if (!manualLayoutLocksRef.current[slideId]) {
      manualLayoutLocksRef.current[slideId] = new Set();
    }
    return manualLayoutLocksRef.current[slideId];
  }, []);

  const lockLayerFromAutoStack = useCallback(
    (layerId) => {
      if (!layerId || !activeSlideId) return;
      const lockedSet = getLockedSetForSlide(activeSlideId);
      lockedSet.add(layerId);
    },
    [activeSlideId, getLockedSetForSlide]
  );

  const isStackableLayer = useCallback((layer) => {
    return layer?.type === "text" || layer?.type === "numbered-list";
  }, []);

  const shouldAutoStackLayer = useCallback(
    (layer) => {
      if (!isStackableLayer(layer)) return false;
      const lockedSet = getLockedSetForSlide(activeSlideId);
      return !lockedSet.has(layer.id);
    },
    [activeSlideId, getLockedSetForSlide, isStackableLayer]
  );

  const autoStackLayers = useCallback(
    (layers) => {
      let currentY = STACK_START_Y;

      const updatedLayers = layers.map((layer) => {
        if (!isStackableLayer(layer)) return layer;

        if (!shouldAutoStackLayer(layer)) {
          const layerBottom = (layer.y || 0) + (layer.height || 0);
          currentY = Math.max(currentY, layerBottom + STACK_GAP);
          return layer;
        }

        const el = layerRefs.current[layer.id];
        if (!el) return layer;

        const textContentEl = el.querySelector('[data-text-content="true"]');
        const measuredContentHeight = textContentEl
          ? Math.ceil(textContentEl.scrollHeight || textContentEl.getBoundingClientRect().height || 0)
          : 0;
        const actualHeight = measuredContentHeight > 0
          ? Math.max(30, measuredContentHeight + 12)
          : Math.max(30, Math.ceil(el.offsetHeight || layer.height || 30));

        const updatedLayer = {
          ...layer,
          y: currentY,
          height: actualHeight,
        };

        currentY += actualHeight + STACK_GAP;
        return updatedLayer;
      });

      return updatedLayers;
    },
    [isStackableLayer, shouldAutoStackLayer]
  );


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

  useEffect(() => {
    if (!activeSlide?.layers?.length) return;
    if (editingLayerId || editingCell || draggingId || resizingId || rotatingId) return;
    if (isApplyingAutoStackRef.current) return;
    // Only run auto-stack for slides freshly generated by AI, never for loaded/saved slides.
    if (!isAIGeneratedSlide(activeSlideId)) return;

    const timer = setTimeout(() => {
      const newLayers = autoStackLayers(activeSlide.layers);

      const oldLayout = activeSlide.layers
        .filter(shouldAutoStackLayer)
        .map((layer) => ({ id: layer.id, y: layer.y, height: layer.height }));
      const newLayout = newLayers
        .filter(shouldAutoStackLayer)
        .map((layer) => ({ id: layer.id, y: layer.y, height: layer.height }));

      if (JSON.stringify(oldLayout) !== JSON.stringify(newLayout)) {
        isApplyingAutoStackRef.current = true;

        newLayers.forEach((layer) => {
          if (!shouldAutoStackLayer(layer)) return;
          const prev = activeSlide.layers.find((l) => l.id === layer.id);
          if (!prev) return;

          if (prev.y !== layer.y || prev.height !== layer.height) {
            updateTextLayer(layer.id, { y: layer.y, height: layer.height }, false);
          }
        });

        // Auto-stack applied — clear the flag so this never runs again for this slide.
        clearAIGeneratedSlide(activeSlideId);

        requestAnimationFrame(() => {
          isApplyingAutoStackRef.current = false;
        });
      } else {
        // Layout already correct — still clear the flag.
        clearAIGeneratedSlide(activeSlideId);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [
    activeSlide,
    autoStackLayers,
    shouldAutoStackLayer,
    updateTextLayer,
    editingLayerId,
    editingCell,
    draggingId,
    resizingId,
    rotatingId,
  ]);

  // Keep dragContextRef always current so the document-level handler never has stale values.
  useEffect(() => {
    dragContextRef.current = {
      draggingId, resizingId, rotatingId,
      offset, startSize, startPos,
      activeSlide,
    };
  }, [draggingId, resizingId, rotatingId, offset, startSize, startPos, activeSlide]);

  // Document-level mouse handlers — mounted ONCE (empty deps).
  // Reads all live values through dragContextRef so nothing is ever stale.
  // This is the standard pattern for drag-and-drop that works even when the
  // pointer leaves the slide div (e.g. dragging an element from outside the canvas).
  useEffect(() => {
    const onMove = (e) => {
      const { draggingId, resizingId, rotatingId, offset, startSize, startPos, activeSlide } =
        dragContextRef.current;
      if (!slideRef.current || (!draggingId && !resizingId && !rotatingId)) return;

      const slideRect = slideRef.current.getBoundingClientRect();

      if (draggingId) {
        dragStartedRef.current = true;
        const scale = slideRect.width / SLIDE_WIDTH;

        const layer = activeSlide?.layers?.find((l) => l.id === draggingId);
        if (!layer) return;

        let newX = (e.clientX - slideRect.left - offset.x) / scale;
        let newY = (e.clientY - slideRect.top - offset.y) / scale;

        // Smart Guides & Snapping
        const guides = [];
        const threshold = 5 / scale;

        const snapX = (targetX, guidePos) => {
          if (Math.abs(newX - targetX) < threshold) {
            newX = targetX;
            guides.push({ type: 'v', x: guidePos });
          }
        };
        const snapY = (targetY, guidePos) => {
          if (Math.abs(newY - targetY) < threshold) {
            newY = targetY;
            guides.push({ type: 'h', y: guidePos });
          }
        };

        // Snap to slide center
        snapX(SLIDE_WIDTH / 2 - layer.width / 2, SLIDE_WIDTH / 2);
        snapY(SLIDE_HEIGHT / 2 - layer.height / 2, SLIDE_HEIGHT / 2);

        // Snap to other layers
        activeSlide?.layers?.forEach((other) => {
          if (other.id === draggingId) return;
          snapX(other.x, other.x);
          snapX(other.x + other.width, other.x + other.width);
          snapX(other.x - layer.width, other.x);
          snapX(other.x + other.width - layer.width, other.x + other.width);
          snapX(other.x + other.width / 2 - layer.width / 2, other.x + other.width / 2);
          snapY(other.y, other.y);
          snapY(other.y + other.height, other.y + other.height);
          snapY(other.y - layer.height, other.y);
          snapY(other.y + other.height - layer.height, other.y + other.height);
          snapY(other.y + other.height / 2 - layer.height / 2, other.y + other.height / 2);
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
        const layer = activeSlide?.layers?.find((l) => l.id === rotatingId);
        if (layer) {
          const layerCenterX = slideRect.left + (layer.x + layer.width / 2) * scale;
          const layerCenterY = slideRect.top + (layer.y + layer.height / 2) * scale;
          const angle =
            Math.atan2(e.clientY - layerCenterY, e.clientX - layerCenterX) * (180 / Math.PI);
          updateLayerRotation(rotatingId, angle + 90);
        }
      }
    };

    const onUp = () => stopAllRef.current?.();

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopAll = () => {
    const { draggingId, activeSlide } = dragContextRef.current;
    if (dragStartedRef.current && draggingId) {
      const draggedLayer = activeSlide?.layers?.find((layer) => layer.id === draggingId);
      if (draggedLayer && isStackableLayer(draggedLayer)) {
        lockLayerFromAutoStack(draggingId);
      }
    }
    dragStartedRef.current = false;
    setDraggingId(null);
    setResizingId(null);
    setRotatingId(null);
    setDragCoords(null);
    setActiveGuides([]);
  };
  // Keep stopAllRef pointing to the latest stopAll closure on every render.
  stopAllRef.current = stopAll;

  if (!activeSlide) return null;

  return (
    <div style={styles.canvasWrapper}>
      <div style={styles.editorCenter}>
        <div
          ref={slideRef}
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
                  layerRef={(el) => {
                    if (el) layerRefs.current[layer.id] = el;
                    else delete layerRefs.current[layer.id];
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    saveToHistory();
                    setSelectedLayer(layer.id);
                    setDraggingId(layer.id);

                    if (slideRef.current) {
                      const sr = slideRef.current.getBoundingClientRect();
                      const sc = sr.width / SLIDE_WIDTH;
                      setOffset({
                        x: e.clientX - sr.left - (layer.x || 0) * sc,
                        y: e.clientY - sr.top - (layer.y || 0) * sc,
                      });
                    }
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
                  ref={(el) => {
                    if (el) layerRefs.current[layer.id] = el;
                    else delete layerRefs.current[layer.id];
                  }}
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

                    if (slideRef.current) {
                      const sr = slideRef.current.getBoundingClientRect();
                      const sc = sr.width / SLIDE_WIDTH;
                      setOffset({
                        x: e.clientX - sr.left - (layer.x || 0) * sc,
                        y: e.clientY - sr.top - (layer.y || 0) * sc,
                      });
                    }
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
                  ref={(el) => {
                    if (el) layerRefs.current[layer.id] = el;
                    else delete layerRefs.current[layer.id];
                  }}
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

                    if (slideRef.current) {
                      const sr = slideRef.current.getBoundingClientRect();
                      const sc = sr.width / SLIDE_WIDTH;
                      setOffset({
                        x: e.clientX - sr.left - (layer.x || 0) * sc,
                        y: e.clientY - sr.top - (layer.y || 0) * sc,
                      });
                    }
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
                ref={(el) => {
                  if (el) layerRefs.current[layer.id] = el;
                  else delete layerRefs.current[layer.id];
                }}
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

                  if (slideRef.current) {
                    const sr = slideRef.current.getBoundingClientRect();
                    const sc = sr.width / SLIDE_WIDTH;
                    setOffset({
                      x: e.clientX - sr.left - (layer.x || 0) * sc,
                      y: e.clientY - sr.top - (layer.y || 0) * sc,
                    });
                  }
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
    background: "#f3f4f6",
    padding: "60px 24px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    marginRight: "60px", // IMPORTANT: right properties panel ki width
  },
  editorCenter: {
    maxWidth: 1000,        // Design max width
    width: "100%",         // Take up available space up to max
    margin: "0 auto",      // Center horizontally
    display: "flex",
    justifyContent: "center",
    // alignItems: "center", // Optional: if we want vertical centering when zoomed out highly
    // Ensure it can grow
  },
  slide: {
    width: "100%",
    maxWidth: "900px",   // canvas chhota ho jayega
    aspectRatio: "16 / 9",
    position: "relative",
    overflow: "visible",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    flexShrink: 0,
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