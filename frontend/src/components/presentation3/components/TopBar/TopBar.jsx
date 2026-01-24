import React from "react";
import usePresentationStore from "../../store/usePresentationStore";

const TopBar = () => {
  const { addTextLayer } = usePresentationStore();

  return (
    <div style={styles.bar}>
      <span>Presentation Editor</span>

      <button
        onClick={addTextLayer}
        style={styles.button}
      >
        Add Text
      </button>
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
  },
};
