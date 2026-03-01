import React, { useState, useRef } from "react";
import usePresentationStore from "../../store/usePresentationStore";
import { debounce } from "lodash";
import { useAuth } from "../../../../contexts/AuthContext";
import useImageUpload from "../../hooks/useImageUpload";
import { withHybridLoader } from "../../utils/withHybridLoader";
import { toggleBlock, isBlockActive } from "../../editors/slate/slateBlocks";
import { Link as LinkIcon, X } from "lucide-react";
import "./properties-panel.css";

const ColorPicker = ({ value, onChange, onHistorySave }) => {
  const isInteracting = React.useRef(false);

  // Debounced reset to clear the interaction flag after user stops dragging
  const resetInteraction = React.useCallback(
    debounce(() => {
      isInteracting.current = false;
    }, 500),
    []
  );

  const handleChange = (e) => {
    const newValue = e.target.value;

    // Only save history at the START of a continuous interaction (drag/hover)
    if (!isInteracting.current) {
      onHistorySave();
      isInteracting.current = true;
    }

    // Update state without saving history (live preview)
    onChange(newValue, false);

    // Reset flag if no updates for 500ms
    resetInteraction();
  };

  return <input type="color" value={value} onChange={handleChange} />;
};

const RangeControl = ({ label, value, min, max, onChange, onHistorySave }) => {
  return (
    <div style={styles.control}>
      <label style={styles.label}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value), false)}
          onMouseUp={onHistorySave}
          style={{ flex: 1 }}
        />
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const val = Number(e.target.value);
            onChange(val, true); // Immediate save for direct number input
          }}
          style={{ width: "50px" }}
        />
      </div>
    </div>
  );
};

// Shared 2x5 palette used for slide background + text colors
const PALETTE_COLORS = [
  "#ffffff",
  "#e5e7eb",
  "#64748b",
  "#000000",
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#f97316",
];

// MS Paint–style color control with current color, "+" custom picker and swatch grid
const PaletteColorControl = ({
  label,
  value,
  onColorChange,
  onHistorySave,
}) => {
  const inputRef = useRef(null);
  const currentColor = value || "#ffffff";

  const handleOpenPicker = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleCustomChange = (e) => {
    const newColor = e.target.value;
    if (!newColor) return;
    if (onHistorySave) onHistorySave();
    onColorChange(newColor);
  };

  const handleSwatchClick = (color) => {
    if (onHistorySave) onHistorySave();
    onColorChange(color);
  };

  return (
    <div className="panel-section">
      <div className="panel-section-header">
        <span>{label}</span>
      </div>

      <div className="palette-row">
        <div
          className="palette-color-current"
          style={{ backgroundColor: currentColor }}
        />
        <button
          type="button"
          className="palette-color-add"
          onClick={handleOpenPicker}
        >
          +
        </button>
        <input
          ref={inputRef}
          type="color"
          value={currentColor}
          onChange={handleCustomChange}
          className="palette-color-input-hidden"
        />
      </div>

      <div className="color-swatch-grid">
        {PALETTE_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-swatch ${currentColor.toLowerCase() === color.toLowerCase()
              ? "selected"
              : ""
              }`}
            style={{ backgroundColor: color }}
            onClick={() => handleSwatchClick(color)}
          />
        ))}
      </div>
    </div>
  );
};

const PropertiesPanel = () => {
  const {
    slides,
    activeSlideId,
    getSelectedLayer,
    updateSlideBackground,
    updateTextLayer,
    updateShapeLayer,
    setTextAlignment,
    toggleBold,
    toggleItalic,
    toggleUnderline,
    setSlideBackgroundImage,
    reorderLayer,
    updateLayerRotation,
    alignLayer,
    addTableRow,
    addTableColumn,
    removeTableRow,
    removeTableColumn,
    saveToHistory,
    updateLayerStyle,
    applyGlobalTextStyle,
    selectedLayerId, // Add selectedLayerId
    editingLayerId,
    selectionMarks,
    editingCell, // Add editingCell
    updateTableCell, // Add updateTableCell
    activeEditor,
    presentationId,
  } = usePresentationStore();

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
  ];

  const activeSlide = slides.find(
    (slide) => slide.id === activeSlideId
  );

  const selectedLayer = getSelectedLayer();

  if (!activeSlide) return null;

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
        {/* SLIDE PROPERTIES (no layer selected) */}
        {!selectedLayer && (
          <>
            <h3 style={styles.heading}>Slide</h3>

            {/* Section 1: Background Color (MS Paint style) */}
            <PaletteColorControl
              label="Background"
              value={activeSlide.background}
              onHistorySave={saveToHistory}
              onColorChange={(color) =>
                updateSlideBackground(activeSlideId, color, true)
              }
            />

            {/* Section 2: Background Image */}
            <div className="panel-section">
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

                {showUrlPopup && (
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
                  </div>
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
            <h3 style={styles.heading}>Arrange</h3>
            <div style={styles.row}>
              <button
                style={styles.btn}
                onClick={() => reorderLayer(selectedLayer.id, "forward")}
                title="Bring Forward"
              >
                Bring Forward
              </button>
              <button
                style={styles.btn}
                onClick={() => reorderLayer(selectedLayer.id, "backward")}
                title="Send Backward"
              >
                Send Backward
              </button>
            </div>

            <div style={styles.control}>
              <label style={styles.label}>Rotation</label>
              <button
                style={{ ...styles.btn, width: "100%" }}
                onClick={() => {
                  const currentRotation = selectedLayer.rotation || 0;
                  updateLayerRotation(selectedLayer.id, (currentRotation + 90) % 360);
                }}
                title="Rotate 90° clockwise"
              >
                Rotate 90°
              </button>
            </div>

            <div style={styles.control}>
              <label style={styles.label}>Alignment</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                <button
                  style={{ ...styles.btn, padding: '8px' }}
                  onClick={() => alignLayer(selectedLayer.id, 'top-left')}
                  title="Align to top-left"
                >
                  ↖
                </button>
                <button
                  style={{ ...styles.btn, padding: '8px' }}
                  onClick={() => alignLayer(selectedLayer.id, 'top')}
                  title="Align to top center"
                >
                  ↑
                </button>
                <button
                  style={{ ...styles.btn, padding: '8px' }}
                  onClick={() => alignLayer(selectedLayer.id, 'top-right')}
                  title="Align to top-right"
                >
                  ↗
                </button>
                <button
                  style={{ ...styles.btn, padding: '8px' }}
                  onClick={() => alignLayer(selectedLayer.id, 'left')}
                  title="Align to left center"
                >
                  ←
                </button>
                <button
                  style={{ ...styles.btn, padding: '8px' }}
                  onClick={() => alignLayer(selectedLayer.id, 'center')}
                  title="Align to center"
                >
                  ⊙
                </button>
                <button
                  style={{ ...styles.btn, padding: '8px' }}
                  onClick={() => alignLayer(selectedLayer.id, 'right')}
                  title="Align to right center"
                >
                  →
                </button>
                <button
                  style={{ ...styles.btn, padding: '8px' }}
                  onClick={() => alignLayer(selectedLayer.id, 'bottom-left')}
                  title="Align to bottom-left"
                >
                  ↙
                </button>
                <button
                  style={{ ...styles.btn, padding: '8px' }}
                  onClick={() => alignLayer(selectedLayer.id, 'bottom')}
                  title="Align to bottom center"
                >
                  ↓
                </button>
                <button
                  style={{ ...styles.btn, padding: '8px' }}
                  onClick={() => alignLayer(selectedLayer.id, 'bottom-right')}
                  title="Align to bottom-right"
                >
                  ↘
                </button>
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
                  onColorChange={(color) =>
                    updateLayerStyle(selectedLayer.id, {
                      borderColor: color,
                    })
                  }
                />
                <div className="property-row">
                  <label>Border Width ({selectedLayer.borderWidth || 1}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={selectedLayer.borderWidth || 1}
                    onChange={(e) =>
                      updateLayerStyle(selectedLayer.id, {
                        borderWidth: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div style={styles.control}>
              <label style={styles.label}>Table Structure</label>
              <div style={styles.row}>
                <button
                  style={{ ...styles.btn, flex: 1 }}
                  onClick={() => addTableRow(selectedLayer.id)}
                >
                  + Row
                </button>
                <button
                  style={{ ...styles.btn, flex: 1 }}
                  onClick={() => addTableColumn(selectedLayer.id)}
                >
                  + Col
                </button>
              </div>
              <div style={{ ...styles.row, marginTop: "8px" }}>
                <button
                  style={{ ...styles.btn, flex: 1 }}
                  disabled={selectedLayer.rows <= 1}
                  onClick={() => removeTableRow(selectedLayer.id)}
                  title={selectedLayer.rows <= 1 ? "Cannot remove last row" : "Remove Row"}
                >
                  - Row
                </button>
                <button
                  style={{ ...styles.btn, flex: 1 }}
                  disabled={selectedLayer.cols <= 1}
                  onClick={() => removeTableColumn(selectedLayer.id)}
                  title={selectedLayer.cols <= 1 ? "Cannot remove last column" : "Remove Column"}
                >
                  - Col
                </button>
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
            <div style={styles.control}>
              <label style={styles.label}>Shape Color</label>
              <ColorPicker
                value={
                  selectedLayer.shapeType === "line" ||
                    selectedLayer.shapeType === "arrow"
                    ? selectedLayer.stroke
                    : selectedLayer.fill
                }
                onHistorySave={saveToHistory}
                onChange={(val, saveHistory) => {
                  const isLineOrArrow =
                    selectedLayer.shapeType === "line" ||
                    selectedLayer.shapeType === "arrow";

                  updateShapeLayer(selectedLayer.id, {
                    [isLineOrArrow ? "stroke" : "fill"]: val,
                  }, saveHistory);
                }}
              />
            </div>
          </>
        )}


        {/* ========================= */}
        {/* TEXT PROPERTIES (Also for Table Cells when editing) */}
        {/* ========================= */}
        {(selectedLayer?.type === "text" || (selectedLayer?.type === "table" && editingCell)) && (
          <>
            <h3 style={styles.heading}>
              {selectedLayer.type === "table" ? "Cell Text" : "Text"}
            </h3>

            {/* Font Size */}
            <div style={styles.control}>
              <label style={styles.label}>Font Size</label>
              <input
                type="number"
                value={
                  editingLayerId || editingCell
                    ? (selectionMarks.fontSize || (editingCell ? selectedLayer.cells?.[editingCell.row]?.[editingCell.col]?.fontSize : selectedLayer.fontSize))
                    : selectedLayer.fontSize
                }
                min={8}
                max={200}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (editingLayerId) {
                    window.dispatchEvent(new CustomEvent('slate-apply-mark', { detail: { format: 'fontSize', value: val } }));
                  } else if (editingCell) {
                    window.dispatchEvent(new CustomEvent('slate-apply-mark', { detail: { format: 'fontSize', value: val } }));
                    // Also update cell prop directly for container style
                    updateTableCell(selectedLayer.id, editingCell.row, editingCell.col, { fontSize: val });
                  } else {
                    applyGlobalTextStyle(selectedLayer.id, { fontSize: val });
                  }
                }}
              />
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
              onColorChange={(color) => {
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
                  updateTableCell(selectedLayer.id, editingCell.row, editingCell.col, { color: color });
                } else {
                  applyGlobalTextStyle(selectedLayer.id, { color });
                }
              }}
            />
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


            {/* Bold / Italic / Underline / Lists */}
            <div style={styles.control}>
              <label style={styles.label}>Style</label>
              <div style={styles.row}>
                <button
                  onClick={() => {
                    if (editingLayerId || editingCell) {
                      window.dispatchEvent(new CustomEvent('slate-toggle-mark', { detail: { format: 'bold' } }));
                    } else {
                      const newVal = selectedLayer.fontWeight === "bold" ? "normal" : "bold";
                      applyGlobalTextStyle(selectedLayer.id, { fontWeight: newVal });
                    }
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    ...styles.btn,
                    background:
                      (editingLayerId ? selectionMarks.bold : (editingCell && selectionMarks.bold) || selectedLayer.fontWeight === "bold")
                        ? "#2563eb"
                        : "#f3f4f6",
                    color:
                      (editingLayerId ? selectionMarks.bold : (editingCell && selectionMarks.bold) || selectedLayer.fontWeight === "bold")
                        ? "#fff"
                        : "#000",
                  }}
                >
                  B
                </button>

                <button
                  onClick={() => {
                    if (editingLayerId || editingCell) {
                      window.dispatchEvent(new CustomEvent('slate-toggle-mark', { detail: { format: 'italic' } }));
                    } else {
                      const newVal = selectedLayer.fontStyle === "italic" ? "normal" : "italic";
                      applyGlobalTextStyle(selectedLayer.id, { fontStyle: newVal });
                    }
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    ...styles.btn,
                    background:
                      (editingLayerId ? selectionMarks.italic : (editingCell && selectionMarks.italic) || selectedLayer.fontStyle === "italic")
                        ? "#2563eb"
                        : "#f3f4f6",
                    color:
                      (editingLayerId ? selectionMarks.italic : (editingCell && selectionMarks.italic) || selectedLayer.fontStyle === "italic")
                        ? "#fff"
                        : "#000",
                  }}
                >
                  I
                </button>

                <button
                  onClick={() => {
                    if (editingLayerId || editingCell) {
                      window.dispatchEvent(new CustomEvent('slate-toggle-mark', { detail: { format: 'underline' } }));
                    } else {
                      const newVal = selectedLayer.textDecoration === "underline" ? "none" : "underline";
                      applyGlobalTextStyle(selectedLayer.id, { textDecoration: newVal });
                    }
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    ...styles.btn,
                    background:
                      (editingLayerId ? selectionMarks.underline : (editingCell && selectionMarks.underline) || selectedLayer.textDecoration === "underline")
                        ? "#2563eb"
                        : "#f3f4f6",
                    color:
                      (editingLayerId ? selectionMarks.underline : (editingCell && selectionMarks.underline) || selectedLayer.textDecoration === "underline")
                        ? "#fff"
                        : "#000",
                  }}
                >
                  U
                </button>

                {/* Bullet List */}
                <button
                  onClick={() => {
                    if (activeEditor) toggleBlock(activeEditor, "bulleted-list");
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    ...styles.btn,
                    background: (activeEditor && isBlockActive(activeEditor, "bulleted-list")) ? "#2563eb" : "#f3f4f6",
                    color: (activeEditor && isBlockActive(activeEditor, "bulleted-list")) ? "#fff" : "#000",
                  }}
                  title="Bullet List"
                >
                  •
                </button>

                {/* Numbered List */}
                <button
                  onClick={() => {
                    if (activeEditor) toggleBlock(activeEditor, "numbered-list");
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    ...styles.btn,
                    background: (activeEditor && isBlockActive(activeEditor, "numbered-list")) ? "#2563eb" : "#f3f4f6",
                    color: (activeEditor && isBlockActive(activeEditor, "numbered-list")) ? "#fff" : "#000",
                    fontWeight: "600",
                    fontSize: "10px"
                  }}
                  title="Numbered List"
                >
                  1.
                </button>
              </div>
            </div>

            {/* Alignment */}
            <div style={styles.control}>
              <label style={styles.label}>Alignment</label>
              <div style={styles.row}>
                {["left", "center", "right"].map((align) => (
                  <button
                    key={align}
                    style={{
                      ...styles.btn,
                      background:
                        (editingCell && selectedLayer.cells?.[editingCell.row]?.[editingCell.col]?.textAlign === align) || selectedLayer.textAlign === align
                          ? "#2563eb"
                          : "#f3f4f6",
                      color:
                        (editingCell && selectedLayer.cells?.[editingCell.row]?.[editingCell.col]?.textAlign === align) || selectedLayer.textAlign === align
                          ? "#fff"
                          : "#000",
                    }}
                    onClick={() => {
                      if (editingLayerId) {
                        window.dispatchEvent(new CustomEvent('slate-set-block-style', { detail: { properties: { textAlign: align } } }));
                        updateTextLayer(selectedLayer.id, { textAlign: align }, false);
                      } else if (editingCell) {
                        window.dispatchEvent(new CustomEvent('slate-set-block-style', { detail: { properties: { textAlign: align } } }));
                        updateTableCell(selectedLayer.id, editingCell.row, editingCell.col, { textAlign: align });
                      } else {
                        applyGlobalTextStyle(selectedLayer.id, { textAlign: align });
                      }
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
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
            <h3 style={styles.heading}>Image Style</h3>

            <RangeControl
              label="Corner Radius"
              value={selectedLayer.borderRadius || 0}
              min={0}
              max={100}
              onChange={(val, saveHistory) =>
                updateLayerStyle(selectedLayer.id, { borderRadius: val }, saveHistory)
              }
              onHistorySave={saveToHistory}
            />

            <RangeControl
              label="Border Width"
              value={selectedLayer.borderWidth || 0}
              min={0}
              max={20}
              onChange={(val, saveHistory) =>
                updateLayerStyle(selectedLayer.id, { borderWidth: val }, saveHistory)
              }
              onHistorySave={saveToHistory}
            />

            <div style={styles.control}>
              <label style={styles.label}>Border Color</label>
              <PaletteColorControl
                label="Border Color"
                value={selectedLayer.borderColor || "#000000"}
                onHistorySave={saveToHistory}
                onColorChange={(color) =>
                  updateLayerStyle(selectedLayer.id, { borderColor: color }, false)
                }
              />
            </div>
          </>
        )}
      </div>


    </div>
  );
};

export default PropertiesPanel;

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
  },
};