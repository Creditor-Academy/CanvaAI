import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import usePresentationStore from "../../store/usePresentationStore";
import { debounce } from "lodash";
import { useAuth } from "../../../../contexts/AuthContext";
import useImageUpload from "../../hooks/useImageUpload";
import { withHybridLoader } from "../../utils/withHybridLoader";
import { toggleBlock, isBlockActive } from "../../editors/slate/slateBlocks";
import { Link as LinkIcon, X } from "lucide-react";
import "./properties-panel.css";
import {
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignLeft,
  AlignCenter,
  AlignRight
} from "lucide-react";


const ColorPicker = React.memo(({ value, onChange, onHistorySave }) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync with prop if it changes from outside
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Live update in store without history
    onChange(newValue, false);
  };

  const handleCommit = () => {
    if (localValue !== value) {
      if (onHistorySave) onHistorySave();
      onChange(localValue, true);
    }
  };

  return (
    <input
      type="color"
      value={localValue}
      onChange={handleChange}
      onBlur={handleCommit}
    />
  );
});

const RangeControl = React.memo(({ label, value, min, max, onChange, onHistorySave }) => {
  const [localValue, setLocalValue] = useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const val = Number(e.target.value);
    setLocalValue(val);
    onChange(val, false);
  };

  const handleCommit = () => {
    if (localValue !== value) {
      if (onHistorySave) onHistorySave();
      onChange(localValue, true);
    }
  };

  return (
    <div style={styles.control}>
      <label style={styles.label}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="range"
          min={min}
          max={max}
          value={localValue}
          onChange={handleChange}
          onMouseUp={handleCommit}
          onBlur={handleCommit}
          style={{ flex: 1 }}
        />
        <input
          type="number"
          min={min}
          max={max}
          value={localValue}
          onChange={handleChange}
          onBlur={handleCommit}
          style={{ width: "50px" }}
        />
      </div>
    </div>
  );
});

// Shared 2x5 palette used for slide background + text colors
const THEME_COLORS = [
  ["#ffffff", "#ff0000", "#ffc000", "#ffff00", "#92d050", "#00b050",],
  ["#00b0f0", "#0070c0", "#002060", "#7030a0", "#ff66cc", "#999999"],
];


// MS Paint–style color control with current color, "+" custom picker and swatch grid
const PaletteColorControl = ({
  label,
  value,
  onColorChange,
  onHistorySave,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const isInteracting = useRef(false);
  const btnRef = useRef(null);

  // Debounced reset to clear the interaction flag after user stops dragging
  const resetInteraction = React.useCallback(
    debounce(() => {
      isInteracting.current = false;
    }, 500),
    []
  );

  const inputRef = useRef(null);
  const currentColor = value || "#ffffff";

  const handleOpenPicker = () => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.click();
      }
    }, 10);
  };

  const handleCustomChange = (e) => {
    const newColor = e.target.value;
    if (!newColor) return;

    // Only save history at the START of a continuous interaction (drag/hover)
    if (!isInteracting.current) {
      if (onHistorySave) onHistorySave();
      isInteracting.current = true;
    }

    // Update state without saving history (live preview)
    onColorChange(newColor, false);

    // Reset flag if no updates for 500ms
    resetInteraction();
  };

  const handleSwatchClick = (color) => {
    if (onHistorySave) onHistorySave();
    onColorChange(color, true); // Immediate save for discrete click
  };

  return (
    <div className="panel-section">
      <div className="panel-section-header">
        <span>{label}</span>
      </div>

      <div className="palette-heading">Colors</div>

      <div className="theme-colors">
        {THEME_COLORS.slice(0, 2).map((row, rowIndex) => (
          <div key={rowIndex} className="color-row">
            {row.slice(0, 6).map((color) => (
              <button
                key={color}
                className={`color-swatch ${currentColor === color ? "selected" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => handleSwatchClick(color)}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="palette-bottom-row">
        <div className="no-fill" onClick={() => handleSwatchClick("transparent")}>
          <div className="no-fill-box"></div>
          <span>No Fill</span>
        </div>

        <label className="palette-color-add">
          +
          <input
            type="color"
            value={currentColor}
            onChange={handleCustomChange}
            className="palette-color-input-hidden"
          />
        </label>
      </div>
    </div>
  );
};

const PropertiesPanel = () => {
  // 1. Individual Selectors for state
  const activeSlideId = usePresentationStore(state => state.activeSlideId);
  const slides = usePresentationStore(state => state.slides);
  const selectedLayerId = usePresentationStore(state => state.selectedLayerId);
  const editingLayerId = usePresentationStore(state => state.editingLayerId);
  const editingCell = usePresentationStore(state => state.editingCell);
  const selectionMarks = usePresentationStore(state => state.selectionMarks);
  const activeEditor = usePresentationStore(state => state.activeEditor);
  const presentationId = usePresentationStore(state => state.presentationId);

  // 2. Selectors for actions
  const updateSlideBackground = usePresentationStore(state => state.updateSlideBackground);
  const updateTextLayer = usePresentationStore(state => state.updateTextLayer);
  const updateShapeLayer = usePresentationStore(state => state.updateShapeLayer);
  const setSlideBackgroundImage = usePresentationStore(state => state.setSlideBackgroundImage);
  const reorderLayer = usePresentationStore(state => state.reorderLayer);
  const updateLayerRotation = usePresentationStore(state => state.updateLayerRotation);
  const alignLayer = usePresentationStore(state => state.alignLayer);
  const addTableRow = usePresentationStore(state => state.addTableRow);
  const addTableColumn = usePresentationStore(state => state.addTableColumn);
  const removeTableRow = usePresentationStore(state => state.removeTableRow);
  const removeTableColumn = usePresentationStore(state => state.removeTableColumn);
  const saveToHistory = usePresentationStore(state => state.saveToHistory);
  const updateLayerStyle = usePresentationStore(state => state.updateLayerStyle);
  const applyGlobalTextStyle = usePresentationStore(state => state.applyGlobalTextStyle);
  const updateTableCell = usePresentationStore(state => state.updateTableCell);

  const { user } = useAuth();
  const { uploadFile, isUploading } = useImageUpload();

  const [collapsed, setCollapsed] = useState(false);
  const [showUrlPopup, setShowUrlPopup] = useState(false);
  const [tempUrl, setTempUrl] = useState("");


  const FONTS = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Georgia",
    "Courier New",
    "Verdana",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Playfair Display",
    "Merriweather",
    "Raleway",
    "Ubuntu",
    "Source Sans Pro",
    "PT Sans",
    "Inter",
    "Nunito",
    "Work Sans",
    "Noto Sans",
    "Crimson Text",
    "Libre Baskerville",
    "Fira Sans",
    "DM Sans",
    "Imperial Script",
    "Luxurious Script",
    "Allura",
    "Burgues Script",
    "Desirable Calligraphy",
  ];

  const activeSlide = React.useMemo(() =>
    slides.find(s => s.id === activeSlideId),
    [slides, activeSlideId]
  );

  const selectedLayer = React.useMemo(() =>
    activeSlide?.layers?.find(l => l.id === selectedLayerId) || null,
    [activeSlide?.layers, selectedLayerId]
  );

  return (
    <div className={`properties-panel ${collapsed ? "collapsed" : ""}`}>

      {/* Collapse Button */}
      <button
        className="properties-collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? "‹" : "›"}
      </button>

      {/* Scrollable Content */}
      <div className="properties-content">
        {!activeSlide ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
            Select a slide to edit properties
          </div>
        ) : (
          <>
            {/* SLIDE PROPERTIES (no layer selected) */}
            {!selectedLayer && (
              <>
                <h3 style={styles.heading}>Slide</h3>

                {/* Section 1: Background Color (MS Paint style) */}
                <PaletteColorControl
                  label="Background"
                  value={activeSlide.background}
                  onHistorySave={saveToHistory}
                  onColorChange={(color, save) =>
                    updateSlideBackground(activeSlideId, color, save)
                  }
                />

                {/* Section 2: Background Image */}
                <div className="panel-section ">
                  <div className="panel-section-header">
                    <span>Background Image</span>
                  </div>

                  <div style={styles.row}>
                    <button
                      style={{ ...styles.btn, flex: 1 }}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;

                          try {
                            await withHybridLoader(
                              async () => {
                                const pptId = presentationId || "new";
                                const { url, key } = await uploadFile(file, user?._id, pptId);

                                setSlideBackgroundImage(activeSlideId, url, key);
                                e.target.value = ""; // Reset input

                                return { url, key };
                              },
                              "top",
                              "Uploading background image..."
                            );
                          } catch (error) {
                            alert("Failed to upload background image.");
                          }
                        };
                        input.click();
                      }}
                    >
                      Insert Image (Local)
                    </button>
                  </div>

                  <div style={{ ...styles.row, marginTop: "8px", position: "relative" }}>
                    <button
                      style={{ ...styles.btn, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onClick={() => setShowUrlPopup(!showUrlPopup)}
                      title="Set background image from URL"
                    >
                      <LinkIcon size={16} /> Insert from URL
                    </button>

                    {showUrlPopup && createPortal(
                      <div className="modal-overlay" onClick={() => setShowUrlPopup(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                          <h3>Add Image from URL</h3>
                          <input
                            type="url"
                            placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                            value={tempUrl}
                            onChange={(e) => setTempUrl(e.target.value)}
                            className="url-input-field"
                          />
                          <div className="modal-buttons">
                            <button
                              className="secondary-btn"
                              onClick={() => setShowUrlPopup(false)}
                            >
                              Cancel
                            </button>
                            <button
                              className="primary-btn"
                              onClick={() => {
                                if (tempUrl) {
                                  setSlideBackgroundImage(activeSlideId, tempUrl);
                                  setTempUrl("");
                                  setShowUrlPopup(false);
                                }
                              }}
                              disabled={!tempUrl}
                            >
                              Add Image
                            </button>
                          </div>
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>

                  {activeSlide.backgroundImage && (
                    <button
                      style={{
                        ...styles.btn,
                        color: "#dc3545",
                        borderColor: "#dc3545",
                        marginTop: "8px",
                        width: "100%",
                      }}
                      onClick={() => setSlideBackgroundImage(activeSlideId, null)}
                      title="Remove image"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </>
            )}


            {/* ========================= */}
            {/* COMMON LAYER PROPERTIES (Arrange + canvas alignment) */}
            {selectedLayer && (
              <div style={{ marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                <h3 style={styles.heading}>Position</h3>

                <div className="tool-section">
                  <div className="tool-title">Alignment</div>

                  <div className="align-row">
                    {/* Horizontal */}
                    <button title="Align Left"
                      onClick={() => alignLayer(selectedLayer.id, 'left')}>
                      <AlignStartVertical size={16} />
                    </button>

                    <button title="Align Center"
                      onClick={() => alignLayer(selectedLayer.id, 'center')}>
                      <AlignCenterHorizontal size={16} />
                    </button>

                    <button title="Align Right"
                      onClick={() => alignLayer(selectedLayer.id, 'right')}>
                      <AlignEndVertical size={16} />
                    </button>

                    <div className="align-divider"></div>

                    {/* Vertical */}
                    <button title="Align Top"
                      onClick={() => alignLayer(selectedLayer.id, 'top')}>
                      <AlignStartHorizontal size={16} />
                    </button>

                    <button title="Align Center"
                      onClick={() => alignLayer(selectedLayer.id, 'center')}>
                      <AlignCenterVertical size={16} />
                    </button>



                    <button title="Align Bottom"
                      onClick={() => alignLayer(selectedLayer.id, 'bottom')}>
                      <AlignEndHorizontal size={16} />
                    </button>
                  </div>
                </div>

                <div className="tool-section">
                  <div className="tool-title">Position</div>

                  <div className="xy-row">
                    <div className="xy-input">
                      <span>X-</span>
                      <input
                        type="number"
                        step="0.1"
                        value={Number(selectedLayer.x).toFixed(1)}
                        onChange={(e) =>
                          updateLayerStyle(selectedLayer.id, { x: Number(e.target.value) })
                        }
                      />
                    </div>

                    <div className="xy-input">
                      <span>Y-</span>
                      <input
                        type="number" step="0.1"
                        value={Number(selectedLayer.y).toFixed(1)}
                        onChange={(e) =>
                          updateLayerStyle(selectedLayer.id, { y: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="tool-section">
                  <div className="tool-title">Arrange</div>

                  <div className="arrange-row">
                    <button onClick={() => reorderLayer(selectedLayer.id, "forward")}>
                      Bring Forward
                    </button>

                    <button onClick={() => reorderLayer(selectedLayer.id, "backward")}>
                      Send Backward
                    </button>
                  </div>
                </div>
                <div className="tool-section">
                  <div className="tool-title">Rotation</div>

                  <div className="rotation-only">
                    <span>Rotation</span>
                    <div className="rotation-input">
                      <span>°</span>
                      <input
                        type="number"
                        step="0.1"
                        value={Number(selectedLayer.rotation || 0).toFixed(1)}
                        onChange={(e) =>
                          updateLayerRotation(selectedLayer.id, Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}


            {/* ========================= */}
            {/* TABLE PROPERTIES */}
            {/* ========================= */}
            {selectedLayer?.type === "table" && (
              <>
                <h3 style={styles.heading}>Table</h3>

                <div className="accordion-section open">
                  <div className="accordion-header">
                    <span>Table Style</span>
                  </div>
                  <div className="accordion-content">
                    <PaletteColorControl
                      label="Border Color"
                      value={selectedLayer.borderColor || "#e5e7eb"}
                      onHistorySave={saveToHistory}
                      onColorChange={(color, save) =>
                        updateLayerStyle(selectedLayer.id, {
                          borderColor: color,
                        }, save)
                      }
                    />
                    <div className="tool-section">
                      <div className="tool-title">Border Width</div>

                      <div className="inline-input">
                        <span>Width</span>
                        <input
                          type="number"
                          min={0}
                          max={20}
                          value={selectedLayer.borderWidth || 0}
                          onChange={(e) =>
                            updateLayerStyle(selectedLayer.id, {
                              borderWidth: Math.min(20, Math.max(0, Number(e.target.value))),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tool-section">
                  <div className="tool-title">Table Structure</div>

                  <div className="table-structure">
                    <div className="ts-row">
                      <span>Row</span>
                      <button onClick={() => addTableRow(selectedLayer.id)}>+</button>
                      <button
                        disabled={selectedLayer.rows <= 1}
                        onClick={() => removeTableRow(selectedLayer.id)}
                      >
                        -
                      </button>
                    </div>

                    <div className="ts-row">
                      <span>Column</span>
                      <button onClick={() => addTableColumn(selectedLayer.id)}>+</button>
                      <button
                        disabled={selectedLayer.cols <= 1}
                        onClick={() => removeTableColumn(selectedLayer.id)}
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ========================= */}
            {/* SHAPE PROPERTIES */}
            {/* ========================= */}
            {selectedLayer?.type === "shape" && (
              <>
                <h3 style={styles.heading}>Shape</h3>

                {/* 1. Fill Color (Hidden for Line/Arrow) */}
                {selectedLayer.shapeType !== "line" && selectedLayer.shapeType !== "arrow" && (
                  <PaletteColorControl
                    label="Fill Color"
                    value={selectedLayer.fillColor || "#ffffff"}
                    onHistorySave={saveToHistory}
                    onColorChange={(color, save) =>
                      updateShapeLayer(selectedLayer.id, { fillColor: color }, save)
                    }
                  />
                )}

                {/* 2. Stroke Color */}
                <PaletteColorControl
                  label="Stroke Color"
                  value={selectedLayer.strokeColor || "#000000"}
                  onHistorySave={saveToHistory}
                  onColorChange={(color, save) =>
                    updateShapeLayer(selectedLayer.id, { strokeColor: color }, save)
                  }
                />

                {/* 3. Stroke Width */}
                <div className="tool-section">
                  <div className="tool-title">Stroke Width</div>

                  <div className="inline-input">
                    <span>Width</span>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={selectedLayer.strokeWidth ?? 0}
                      onChange={(e) =>
                        updateShapeLayer(selectedLayer.id, {
                          strokeWidth: Math.min(20, Math.max(0, Number(e.target.value))),
                        })
                      }
                    />
                  </div>
                </div>
              </>
            )}


            {/* ========================= */}
            {/* TEXT PROPERTIES (Also for Table Cells when editing) */}
            {/* ========================= */}
            {(selectedLayer?.type === "text" || (selectedLayer?.type === "table" && editingCell)) && (
              <>
                <h3 style={styles.heading}>
                  {selectedLayer.type === "table" ? "Cell Text" : "Typography"}
                </h3>

                <div className="tool-section typography-card">
                  {/* Font Family */}
                  <div style={styles.control}>
                    <label style={styles.label}>Font</label>
                    <select
                      value={
                        editingLayerId || editingCell
                          ? (selectionMarks.fontFamily || (editingCell ? selectedLayer.cells?.[editingCell.row]?.[editingCell.col]?.fontFamily : selectedLayer.fontFamily))
                          : selectedLayer.fontFamily
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (editingLayerId) {
                          window.dispatchEvent(new CustomEvent('slate-apply-mark', { detail: { format: 'fontFamily', value: val } }));
                        } else if (editingCell) {
                          window.dispatchEvent(new CustomEvent('slate-apply-mark', { detail: { format: 'fontFamily', value: val } }));
                          updateTableCell(selectedLayer.id, editingCell.row, editingCell.col, { fontFamily: val });
                        } else {
                          applyGlobalTextStyle(selectedLayer.id, { fontFamily: val });
                        }
                      }}
                    >
                      {FONTS.map((font) => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="typography-row">
                    {/* Style Dropdown */}
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "bold") {
                          applyGlobalTextStyle(selectedLayer.id, { fontWeight: "bold" });
                        }
                        if (val === "italic") {
                          applyGlobalTextStyle(selectedLayer.id, { fontStyle: "italic" });
                        }
                        if (val === "underline") {
                          applyGlobalTextStyle(selectedLayer.id, { textDecoration: "underline" });
                        }
                      }}
                    >
                      <option value="">Style</option>
                      <option value="bold">Bold</option>
                      <option value="italic">Italic</option>
                      <option value="underline">Underline</option>
                    </select>

                    {/* Font Size */}
                    <input
                      type="number"
                      value={selectedLayer.fontSize}
                      onChange={(e) =>
                        applyGlobalTextStyle(selectedLayer.id, { fontSize: Number(e.target.value) })
                      }
                    />


                  </div>

                  {/* Alignment */}
                  <div style={styles.control}>
                    <label style={styles.label}>Alignment</label>
                    <div className="text-align-row">
                      <button
                        className={selectedLayer.textAlign === "left" ? "active" : ""}
                        onClick={() => applyGlobalTextStyle(selectedLayer.id, { textAlign: "left" })}
                      >
                        <AlignLeft size={16} />
                      </button>

                      <button
                        className={selectedLayer.textAlign === "center" ? "active" : ""}
                        onClick={() => applyGlobalTextStyle(selectedLayer.id, { textAlign: "center" })}
                      >
                        <AlignCenter size={16} />
                      </button>

                      <button
                        className={selectedLayer.textAlign === "right" ? "active" : ""}
                        onClick={() => applyGlobalTextStyle(selectedLayer.id, { textAlign: "right" })}
                      >
                        <AlignRight size={16} />
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <div className="tool-title">Bullets</div>

                    <div className="bullet-row">
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (activeEditor) toggleBlock(activeEditor, "bulleted-list");
                        }}
                        className={activeEditor && isBlockActive(activeEditor, "bulleted-list") ? "active" : ""}
                      >
                        • List
                      </button>

                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (activeEditor) toggleBlock(activeEditor, "numbered-list");
                        }}
                        className={activeEditor && isBlockActive(activeEditor, "numbered-list") ? "active" : ""}
                      >
                        1. List
                      </button>
                    </div>
                  </div>
                </div>



                {/* Text Color – shared palette UI */}
                <PaletteColorControl
                  label="Text Color"
                  value={
                    editingLayerId || editingCell
                      ? (selectionMarks.color || (editingCell ? selectedLayer.cells?.[editingCell.row]?.[editingCell.col]?.color : selectedLayer.color))
                      : selectedLayer.color
                  }
                  onHistorySave={saveToHistory}
                  onColorChange={(color, save) => {
                    if (editingLayerId) {
                      window.dispatchEvent(
                        new CustomEvent("slate-apply-mark", {
                          detail: { format: "color", value: color },
                        })
                      );
                    } else if (editingCell) {
                      window.dispatchEvent(
                        new CustomEvent("slate-apply-mark", {
                          detail: { format: "color", value: color },
                        })
                      );
                      updateTableCell(selectedLayer.id, editingCell.row, editingCell.col, { color: color }, save);
                    } else {
                      applyGlobalTextStyle(selectedLayer.id, { color }, save);
                    }
                  }}
                />



                {/* Link */}
                {selectedLayer.type !== "table" && (
                  <div style={styles.control}>
                    <label style={styles.label}>Link</label>
                    <input
                      type="text"
                      placeholder="https://example.com"
                      value={selectedLayer.link || ""}
                      onChange={(e) => {
                        const url = e.target.value;
                        const updates = { link: url };

                        // Auto-style if adding a link
                        if (url && !selectedLayer.link) {
                          updates.color = "#2563eb";
                          updates.textDecoration = "underline";
                        }

                        updateTextLayer(selectedLayer.id, updates);
                      }}
                    />
                  </div>
                )}





              </>
            )}

            {/* ========================= */}
            {/* TABLE PROPERTIES */}
            {/* ========================= */}

            {/* ========================= */}
            {/* IMAGE PROPERTIES */}
            {/* ========================= */}
            {selectedLayer?.type === "image" && (
              <>
                <div className="tool-section">
                  <div className="tool-title">Image</div>

                  <div className="image-row">
                    <div className="image-input">
                      <span>Radius (%)</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={selectedLayer.borderRadius || 0}
                        onChange={(e) =>
                          updateLayerStyle(selectedLayer.id, {
                            borderRadius: Math.min(100, Math.max(0, Number(e.target.value))),
                          })
                        }
                      />
                    </div>

                    <div className="image-input">
                      <span>Border Width</span>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={selectedLayer.borderWidth || 0}
                        onChange={(e) =>
                          updateLayerStyle(selectedLayer.id, {
                            borderWidth: Math.min(50, Math.max(0, Number(e.target.value))),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>



                <div style={styles.control}>
                  <label style={styles.label}>Border Color</label>
                  <PaletteColorControl
                    label="Border Color"
                    value={selectedLayer.borderColor || "#000000"}
                    onHistorySave={saveToHistory}
                    onColorChange={(color, save) =>
                      updateLayerStyle(selectedLayer.id, { borderColor: color }, save)
                    }
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(PropertiesPanel);

const styles = {
  panel: {
    width: 280,
    flexShrink: 0,
    background: "#fff",
    borderLeft: "1px solid #ddd",
    padding: 12,
  },
  heading: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
  },
  control: {
    marginBottom: 14,
  },
  label: {
    display: "block",
    fontSize: 12,
    marginBottom: 6,
  },
  row: {
    display: "flex",
    gap: 6,
  },
  btn: {
    padding: "6px 10px",
    border: "1px solid #ddd",
    cursor: "pointer",
    fontSize: 14
  },
};