import React, { useState, useRef } from "react";
import usePresentationStore from "../../store/usePresentationStore";
import { debounce } from "lodash";
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
            className={`color-swatch ${
              currentColor.toLowerCase() === color.toLowerCase()
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
    saveToHistory,
    updateLayerStyle,
    editingLayerId,
    selectionMarks,
  } = usePresentationStore();

  const [collapsed, setCollapsed] = useState(false);

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
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setSlideBackgroundImage(activeSlideId, reader.result);
                        e.target.value = ""; // Reset input
                      };
                      reader.readAsDataURL(file);
                    };
                    input.click();
                  }}
                >
                  Insert Image (Local)
                </button>
              </div>

              <div style={{ ...styles.row, marginTop: "8px" }}>
                <input
                  type="text"
                  placeholder="Image URL"
                  style={{
                    ...styles.btn,
                    flex: 1,
                    textAlign: "left",
                    paddingLeft: "8px",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value) {
                      setSlideBackgroundImage(
                        activeSlideId,
                        e.currentTarget.value
                      );
                      e.currentTarget.value = ""; // Clear input
                    }
                  }}
                />
                <button
                  style={{ ...styles.btn }}
                  onClick={() => {
                    const urlInput = document.activeElement; // Get the currently focused element
                    if (
                      urlInput &&
                      urlInput.tagName === "INPUT" &&
                      urlInput.type === "text" &&
                      urlInput.value
                    ) {
                      setSlideBackgroundImage(activeSlideId, urlInput.value);
                      urlInput.value = ""; // Clear input
                    } else {
                      const url = prompt("Enter image URL:");
                      if (url) {
                        setSlideBackgroundImage(activeSlideId, url);
                      }
                    }
                  }}
                  title="Set background image from URL"
                >
                  URL
                </button>
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
                <div className="property-row">
                  <label>Border Color</label>
                  <input
                    type="color"
                    value={selectedLayer.borderColor || "#e5e7eb"}
                    onChange={(e) =>
                      updateLayerStyle(selectedLayer.id, {
                        borderColor: e.target.value,
                      })
                    }
                  />
                </div>
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
        {/* TEXT PROPERTIES */}
        {/* ========================= */}
        {selectedLayer?.type === "text" && (
          <>
            <h3 style={styles.heading}>Text</h3>

            {/* Font Size */}
            <div style={styles.control}>
              <label style={styles.label}>Font Size</label>
              <input
                type="number"
                value={editingLayerId ? (selectionMarks.fontSize || selectedLayer.fontSize) : selectedLayer.fontSize}
                min={8}
                max={200}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (editingLayerId) {
                    window.dispatchEvent(new CustomEvent('slate-apply-mark', { detail: { format: 'fontSize', value: val } }));
                    // Update layer default for responsive UI, no history
                    updateTextLayer(selectedLayer.id, { fontSize: val }, false);
                  } else {
                    updateTextLayer(selectedLayer.id, { fontSize: val });
                  }
                }}
              />
            </div>

            {/* Text Color – shared palette UI */}
            <PaletteColorControl
              label="Text Color"
              value={
                editingLayerId
                  ? selectionMarks.color || selectedLayer.color
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
                  // Update layer default for responsive UI, no history
                  updateTextLayer(selectedLayer.id, { color }, false);
                } else {
                  updateTextLayer(selectedLayer.id, { color }, true);
                }
              }}
            />
            {/* Font Family */}
            <div style={styles.control}>
              <label style={styles.label}>Font</label>
              <select
                value={editingLayerId ? (selectionMarks.fontFamily || selectedLayer.fontFamily) : selectedLayer.fontFamily}
                onChange={(e) => {
                  const val = e.target.value;
                  if (editingLayerId) {
                    window.dispatchEvent(new CustomEvent('slate-apply-mark', { detail: { format: 'fontFamily', value: val } }));
                    // Update layer default for responsive UI, no history
                    updateTextLayer(selectedLayer.id, { fontFamily: val }, false);
                  } else {
                    updateTextLayer(selectedLayer.id, {
                      fontFamily: val,
                    });
                  }
                }}
              >
                {FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>


            {/* Link */}
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


            {/* Bold / Italic / Underline */}
            <div style={styles.control}>
              <label style={styles.label}>Style</label>
              <div style={styles.row}>
                <button
                  onClick={() => {
                    if (editingLayerId) {
                      window.dispatchEvent(new CustomEvent('slate-toggle-mark', { detail: { format: 'bold' } }));
                    } else {
                      toggleBold(selectedLayer.id);
                    }
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    ...styles.btn,
                    background:
                      (editingLayerId ? selectionMarks.bold : selectedLayer.fontWeight === "bold")
                        ? "#2563eb"
                        : "#f3f4f6",
                    color:
                      (editingLayerId ? selectionMarks.bold : selectedLayer.fontWeight === "bold")
                        ? "#fff"
                        : "#000",
                  }}
                >
                  B
                </button>

                <button
                  onClick={() => {
                    if (editingLayerId) {
                      window.dispatchEvent(new CustomEvent('slate-toggle-mark', { detail: { format: 'italic' } }));
                    } else {
                      toggleItalic(selectedLayer.id);
                    }
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    ...styles.btn,
                    background:
                      (editingLayerId ? selectionMarks.italic : selectedLayer.fontStyle === "italic")
                        ? "#2563eb"
                        : "#f3f4f6",
                    color:
                      (editingLayerId ? selectionMarks.italic : selectedLayer.fontStyle === "italic")
                        ? "#fff"
                        : "#000",
                  }}
                >
                  I
                </button>

                <button
                  onClick={() => {
                    if (editingLayerId) {
                      window.dispatchEvent(new CustomEvent('slate-toggle-mark', { detail: { format: 'underline' } }));
                    } else {
                      toggleUnderline(selectedLayer.id);
                    }
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    ...styles.btn,
                    background:
                      (editingLayerId ? selectionMarks.underline : selectedLayer.textDecoration === "underline")
                        ? "#2563eb"
                        : "#f3f4f6",
                    color:
                      (editingLayerId ? selectionMarks.underline : selectedLayer.textDecoration === "underline")
                        ? "#fff"
                        : "#000",
                  }}
                >
                  U
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
                        selectedLayer.textAlign === align
                          ? "#2563eb"
                          : "#f3f4f6",
                      color:
                        selectedLayer.textAlign === align
                          ? "#fff"
                          : "#000",
                    }}
                    onClick={() => {
                      if (editingLayerId) {
                        window.dispatchEvent(new CustomEvent('slate-set-block-style', { detail: { properties: { textAlign: align } } }));
                      }
                      // Always update store for responsive UI
                      setTextAlignment(selectedLayer.id, align);
                    }}
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
        {selectedLayer?.type === "table" && (
          <>
            <h3 style={styles.heading}>Table</h3>

            {/* Font Size */}
            <div style={styles.control}>
              <label style={styles.label}>Font Size</label>
              <input
                type="number"
                value={selectedLayer.fontSize}
                min={8}
                max={100}
                onChange={(e) =>
                  updateTextLayer(selectedLayer.id, {
                    fontSize: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* Border Color */}
            <div style={styles.control}>
              <label style={styles.label}>Border Color</label>
              <ColorPicker
                value={selectedLayer.borderColor || "#d1d5db"}
                onHistorySave={saveToHistory}
                onChange={(val, saveHistory) =>
                  updateTextLayer(selectedLayer.id, {
                    borderColor: val,
                  }, saveHistory)
                }
              />
            </div>

            {/* Text Color */}
            <div style={styles.control}>
              <label style={styles.label}>Text Color</label>
              <ColorPicker
                value={selectedLayer.color || "#000000"}
                onHistorySave={saveToHistory}
                onChange={(val, saveHistory) =>
                  updateTextLayer(selectedLayer.id, {
                    color: val,
                  }, saveHistory)
                }
              />
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
                        selectedLayer.textAlign === align
                          ? "#2563eb"
                          : "#f3f4f6",
                      color:
                        selectedLayer.textAlign === align
                          ? "#fff"
                          : "#000",
                    }}
                    onClick={() =>
                      setTextAlignment(selectedLayer.id, align)
                    }
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Controls (Bold, Italic, Underline) - Reuse logic from text */}
            <div style={styles.control}>
              <label style={styles.label}>Style</label>
              <div style={styles.row}>
                <button
                  onClick={() => toggleBold(selectedLayer.id)}
                  style={{
                    ...styles.btn,
                    background: selectedLayer.fontWeight === "bold" ? "#2563eb" : "#f3f4f6",
                    color: selectedLayer.fontWeight === "bold" ? "#fff" : "#000",
                  }}
                >
                  B
                </button>
                <button
                  onClick={() => toggleItalic(selectedLayer.id)}
                  style={{
                    ...styles.btn,
                    background: selectedLayer.fontStyle === "italic" ? "#2563eb" : "#f3f4f6",
                    color: selectedLayer.fontStyle === "italic" ? "#fff" : "#000",
                  }}
                >
                  I
                </button>
                <button
                  onClick={() => toggleUnderline(selectedLayer.id)}
                  style={{
                    ...styles.btn,
                    background: selectedLayer.textDecoration === "underline" ? "#2563eb" : "#f3f4f6",
                    color: selectedLayer.textDecoration === "underline" ? "#fff" : "#000",
                  }}
                >
                  U
                </button>
              </div>
            </div>

            {/* Link support for Table (Simplified) */}
            <div style={styles.control}>
              <label style={styles.label}>Table Link (Future: per cell)</label>
              <input
                type="text"
                placeholder="https://example.com"
                value={selectedLayer.link || ""}
                onChange={(e) => updateTextLayer(selectedLayer.id, { link: e.target.value })}
              />
            </div>

            {/* Add Row / Column Buttons */}
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
                  + Column
                </button>
              </div>
            </div>
          </>
        )}

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
              <ColorPicker
                value={selectedLayer.borderColor || "#000000"}
                onHistorySave={saveToHistory}
                onChange={(val, saveHistory) =>
                  updateLayerStyle(selectedLayer.id, { borderColor: val }, saveHistory)
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