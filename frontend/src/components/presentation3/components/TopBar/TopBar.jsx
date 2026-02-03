import React from "react";
import usePresentationStore from "../../store/usePresentationStore";
import "./topbar.css";

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
    pastCount,
    futureCount,
  } = usePresentationStore();

  return (
    <div className="topbar">
      <span className="editor-title">Presentation Editor</span>

      {/* Undo / Redo / Copy */}
      <div className="toolbar-group">
        <button
          onClick={undo}
          className="toolbar-btn"
          disabled={pastCount === 0}
          style={{ opacity: pastCount > 0 ? 1 : 0.5 }}
          title="Undo"
        >
          ↶ Undo
        </button>

        <button
          onClick={redo}
          className="toolbar-btn"
          disabled={futureCount === 0}
          style={{ opacity: futureCount > 0 ? 1 : 0.5 }}
          title="Redo"
        >
          ↷ Redo
        </button>

        <button
          onClick={copySelectedLayer}
          className="toolbar-btn"
          title="Copy selected layer"
        >
          📋 Copy
        </button>
      </div>

      {/* Add Text */}
      <button onClick={addTextLayer} className="toolbar-btn">
        Add Text
      </button>

      {/* Add Table */}
      <button
        onClick={() => {
          const rows = prompt("Enter number of rows:", "3");
          const cols = prompt("Enter number of columns:", "3");
          if (rows && cols) {
            addTableLayer(parseInt(rows) || 3, parseInt(cols) || 3);
          }
        }}
        className="toolbar-btn"
      >
        Add Table
      </button>

      {/* Shapes */}
      <div className="toolbar-group">
        <button
          className="shape-btn"
          onClick={() => addShapeLayer("rect")}
          title="Rectangle"
        >
          ⬛
        </button>

        <button
          className="shape-btn"
          onClick={() => addShapeLayer("circle")}
          title="Circle"
        >
          ⚪
        </button>

        <button
          className="shape-btn"
          onClick={() => addShapeLayer("line")}
          title="Line"
        >
          ／
        </button>
      </div>

      {/* Image */}
      <div className="toolbar-group">
        <input
          type="file"
          accept="image/*"
          id="image-upload"
          className="hidden-input"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
              addImageLayer(reader.result);
              e.target.value = "";
            };
            reader.readAsDataURL(file);
          }}
        />

        <button
          onClick={() => document.getElementById("image-upload").click()}
          className="toolbar-btn"
        >
          Add Image
        </button>

        <button
          onClick={() => {
            const url = prompt("Enter image URL");
            if (url) addImageLayer(url);
          }}
          className="toolbar-btn"
        >
          URL
        </button>
      </div>

      {/* Zoom */}
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => setCanvasZoom(Math.max(0.1, canvasZoom - 0.1))}
          title="Zoom Out"
        >
          -
        </button>

        <span className="zoom-display">
          {Math.round(canvasZoom * 100)}%
        </span>

        <button
          className="toolbar-btn"
          onClick={() => setCanvasZoom(Math.min(5, canvasZoom + 0.1))}
          title="Zoom In"
        >
          +
        </button>

        <button
          className="toolbar-btn"
          onClick={() => setCanvasZoom(1.0)}
          title="Reset Zoom"
        >
          Fit
        </button>
      </div>

      {/* Present Button */}
      <button onClick={onPresent} className="present-btn">
        ▶ Present
      </button>
    </div>
  );
};

export default TopBar;