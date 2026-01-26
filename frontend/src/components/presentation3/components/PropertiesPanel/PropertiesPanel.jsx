import React from "react";
import usePresentationStore from "../../store/usePresentationStore";


const PropertiesPanel = () => {
  const {
    slides,
    activeSlideId,
    getSelectedLayer,
    updateSlideBackground,
    updateTextLayer,
    setTextAlignment,
    toggleBold,
    toggleItalic,
    toggleUnderline,
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
                onChange={(e) =>
                  updateTextLayer(selectedLayer.id, {
                    link: e.target.value,
                  })
                }
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
    </div>
  );
};

export default PropertiesPanel;

const styles = {
  panel: {
    width: 260,
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