import React from "react";
import usePresentationStore from "../../store/usePresentationStore";

const TopBar = ({ onPresent }) => {
  const {
    addTextLayer,
    addShapeLayer,
    addImageLayer,
    addTableLayer,
    canvasZoom,
    setCanvasZoom,
    undo,
    redo,
    copySelectedLayer,
    past,
    future,
  } = usePresentationStore();

  return (
    <div style={styles.bar}>
      <span style={{ marginRight: "16px" }}>Presentation Editor</span>

      {/* Undo/Redo/Copy */}
      <div style={styles.shapesGroup}>
        <button
          onClick={undo}
          style={{
            ...styles.button,
            opacity: past.length > 0 ? 1 : 0.5,
            cursor: past.length > 0 ? 'pointer' : 'not-allowed',
          }}
          disabled={past.length === 0}
          title="Undo"
        >
          ↶ Undo
        </button>
        <button
          onClick={redo}
          style={{
            ...styles.button,
            opacity: future.length > 0 ? 1 : 0.5,
            cursor: future.length > 0 ? 'pointer' : 'not-allowed',
          }}
          disabled={future.length === 0}
          title="Redo"
        >
          ↷ Redo
        </button>
        <button
          onClick={copySelectedLayer}
          style={styles.button}
          title="Copy selected layer"
        >
          📋 Copy
        </button>
      </div>

      {/* Text */}
      <button
        onClick={addTextLayer}
        style={styles.button}
      >
        Add Text
      </button>

      {/* Table */}
      <button
        onClick={() => {
          const rows = prompt("Enter number of rows:", "3");
          const cols = prompt("Enter number of columns:", "3");
          if (rows && cols) {
            addTableLayer(parseInt(rows) || 3, parseInt(cols) || 3);
          }
        }}
        style={styles.button}
      >
        Add Table
      </button>

      {/* Shapes */}
      <div style={styles.shapesGroup}>
        <button
          style={styles.shapeButton}
          onClick={() => addShapeLayer("rect")}
          title="Rectangle"
        >
          ⬛
        </button>

        <button
          style={styles.shapeButton}
          onClick={() => addShapeLayer("circle")}
          title="Circle"
        >
          ⚪
        </button>

        <button
          style={styles.shapeButton}
          onClick={() => addShapeLayer("line")}
          title="Line"
        >
          ／
        </button>

        {/* <button
          style={styles.shapeButton}
          onClick={() => addShapeLayer("arrow")}
          title="Arrow"
        >
          ➜
        </button> */}
      </div>

      {/* Image */}
      <div style={styles.shapesGroup}>
        <input
          type="file"
          accept="image/*"
          id="image-upload"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
              addImageLayer(reader.result);
              e.target.value = ""; // Reset input
            };
            reader.readAsDataURL(file);
          }}
        />
        <button
          onClick={() => document.getElementById("image-upload").click()}
          style={styles.button}
        >
          Add Image
        </button>
        <button
          onClick={() => {
            const url = prompt("Enter image URL");
            if (url) addImageLayer(url);
          }}
          style={styles.button}
        >
          URL
        </button>
      </div>

      {/* Zoom Controls */}
      <div style={styles.shapesGroup}>
        <button
          style={styles.button}
          onClick={() => setCanvasZoom(Math.max(0.1, canvasZoom - 0.1))}
          title="Zoom Out"
        >
          -
        </button>
        <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>
          {Math.round(canvasZoom * 100)}%
        </span>
        <button
          style={styles.button}
          onClick={() => setCanvasZoom(Math.min(5, canvasZoom + 0.1))}
          title="Zoom In"
        >
          +
        </button>
        <button
          style={styles.button}
          onClick={() => setCanvasZoom(1.0)}
          title="Reset Zoom"
        >
          Fit
        </button>
      </div>

      <div style={{ marginLeft: "auto" }}>
        <button
          onClick={onPresent}
          style={{
            ...styles.button,
            background: "#2563eb",
            color: "#fff",
            fontWeight: "bold",
            padding: "6px 20px",
          }}
        >
          ▶ Present
        </button>
      </div>
    </div>
  );
};

export default TopBar;

const styles = {
  bar: {
    height: "48px",
    background: "#ffffff",
    borderBottom: "1px solid #ddd",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    fontWeight: 500,
    gap: "12px",
  },

  button: {
    padding: "6px 12px",
    fontSize: "13px",
    cursor: "pointer",
    border: "1px solid #ccc",
    background: "#f8f9fa",
    borderRadius: "4px",
  },

  shapesGroup: {
    display: "flex",
    gap: "6px",
    marginLeft: "12px",
  },

  shapeButton: {
    width: "32px",
    height: "32px",
    border: "1px solid #ccc",
    background: "#ffffff",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};