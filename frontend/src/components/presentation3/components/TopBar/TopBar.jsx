import React from "react";
import usePresentationStore from "../../store/usePresentationStore";

const TopBar = () => {
  const {
    addTextLayer,
    addShapeLayer,
    addImageLayer,
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