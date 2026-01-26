import React from "react";
import usePresentationStore from "../../store/usePresentationStore";

const TopBar = () => {
  const { addTextLayer, addShapeLayer } = usePresentationStore();

  return (
    <div style={styles.bar}>
      <span style={{ marginRight: "16px" }}>Presentation Editor</span>

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

        <button
          style={styles.shapeButton}
          onClick={() => addShapeLayer("arrow")}
          title="Arrow"
        >
          ➜
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