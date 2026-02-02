import React from "react";
import usePresentationStore from "../../store/usePresentationStore";


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
  } = usePresentationStore();
  const FONTS = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Georgia",
    "Courier New",
    "Verdana",
  ];


  const activeSlide = slides.find(
    (slide) => slide.id === activeSlideId
  );

  const selectedLayer = getSelectedLayer();

  if (!activeSlide) return null;

  return (
    <div style={styles.panel}>
      {/* ========================= */}
      {/* SLIDE PROPERTIES */}
      {/* ========================= */}
      {!selectedLayer && (
        <>
          <h3 style={styles.heading}>Slide</h3>

          <div style={styles.control}>
            <label style={styles.label}>Background</label>
            <input
              type="color"
              value={activeSlide.background}
              onChange={(e) =>
                updateSlideBackground(
                  activeSlideId,
                  e.target.value
                )
              }
            />
          </div>

          <div style={styles.control}>
            <label style={styles.label}>Background Image</label>
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
            <div style={{ ...styles.row, marginTop: '8px' }}>
              <input
                type="text"
                placeholder="Image URL"
                style={{ ...styles.btn, flex: 1, textAlign: 'left', paddingLeft: '8px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    setSlideBackgroundImage(activeSlideId, e.currentTarget.value);
                    e.currentTarget.value = ''; // Clear input
                  }
                }}
              />
              <button
                style={{ ...styles.btn }}
                onClick={() => {
                  const urlInput = document.activeElement; // Get the currently focused element
                  if (urlInput && urlInput.tagName === 'INPUT' && urlInput.type === 'text' && urlInput.value) {
                    setSlideBackgroundImage(activeSlideId, urlInput.value);
                    urlInput.value = ''; // Clear input
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
                style={{ ...styles.btn, color: "#dc3545", borderColor: "#dc3545", marginTop: '8px', width: '100%' }}
                onClick={() => setSlideBackgroundImage(activeSlideId, null)}
                title="Remove background image"
              >
                Remove Image
              </button>
            )}
          </div>
        </>
      )}


      {/* ========================= */}
      {/* COMMON LAYER PROPERTIES */}
      {/* ========================= */}
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
      {/* SHAPE PROPERTIES */}
      {/* ========================= */}
      {selectedLayer?.type === "shape" && (
        <>
          <h3 style={styles.heading}>Shape</h3>
          <div style={styles.control}>
            <label style={styles.label}>Shape Color</label>
            <input
              type="color"
              value={
                selectedLayer.shapeType === "line" ||
                  selectedLayer.shapeType === "arrow"
                  ? selectedLayer.stroke
                  : selectedLayer.fill
              }
              onChange={(e) => {
                const color = e.target.value;
                const isLineOrArrow =
                  selectedLayer.shapeType === "line" ||
                  selectedLayer.shapeType === "arrow";

                updateShapeLayer(selectedLayer.id, {
                  [isLineOrArrow ? "stroke" : "fill"]: color,
                });
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
              value={selectedLayer.fontSize}
              min={8}
              max={200}
              onChange={(e) =>
                updateTextLayer(selectedLayer.id, {
                  fontSize: Number(e.target.value),
                })
              }
            />
          </div>

          {/* Text Color */}
          <div style={styles.control}>
            <label style={styles.label}>Text Color</label>
            <input
              type="color"
              value={selectedLayer.color}
              onChange={(e) =>
                updateTextLayer(selectedLayer.id, {
                  color: e.target.value,
                })
              }
            />
          </div>
          {/* Font Family */}
          <div style={styles.control}>
            <label style={styles.label}>Font</label>
            <select
              value={selectedLayer.fontFamily}
              onChange={(e) =>
                updateTextLayer(selectedLayer.id, {
                  fontFamily: e.target.value,
                })
              }
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
                onClick={() => toggleBold(selectedLayer.id)}
                style={{
                  ...styles.btn,
                  background:
                    selectedLayer.fontWeight === "bold"
                      ? "#2563eb"
                      : "#f3f4f6",
                  color:
                    selectedLayer.fontWeight === "bold"
                      ? "#fff"
                      : "#000",
                }}
              >
                B
              </button>

              <button
                onClick={() => toggleItalic(selectedLayer.id)}
                style={{
                  ...styles.btn,
                  background:
                    selectedLayer.fontStyle === "italic"
                      ? "#2563eb"
                      : "#f3f4f6",
                  color:
                    selectedLayer.fontStyle === "italic"
                      ? "#fff"
                      : "#000",
                }}
              >
                I
              </button>

              <button
                onClick={() => toggleUnderline(selectedLayer.id)}
                style={{
                  ...styles.btn,
                  background:
                    selectedLayer.textDecoration === "underline"
                      ? "#2563eb"
                      : "#f3f4f6",
                  color:
                    selectedLayer.textDecoration === "underline"
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
                  onClick={() =>
                    setTextAlignment(selectedLayer.id, align)
                  }
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
            <input
              type="color"
              value={selectedLayer.borderColor || "#d1d5db"}
              onChange={(e) =>
                updateTextLayer(selectedLayer.id, {
                  borderColor: e.target.value,
                })
              }
            />
          </div>

          {/* Text Color */}
          <div style={styles.control}>
            <label style={styles.label}>Text Color</label>
            <input
              type="color"
              value={selectedLayer.color || "#000000"}
              onChange={(e) =>
                updateTextLayer(selectedLayer.id, {
                  color: e.target.value,
                })
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