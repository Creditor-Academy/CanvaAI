import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import usePresentationStore from "../../store/usePresentationStore";
import "./topbar.css";
import {
  Undo2,
  Redo2,
  Copy,
  Type,
  Table,
  Square,
  Circle,
  Minus,
  Image as ImageIcon,
  Play,
  ChevronDown,
  Upload,
  Link,
  Trash2,
  Save
} from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";

const TopBar = ({ onPresent, onAgentClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    deleteSelectedLayer,
    selectedLayerId,
    slides,
    activeSlideId,
    futureCount,
    presentationId,
    title,
    setTitle,
    pastCount,
  } = usePresentationStore();

  const activeSlide = slides.find((s) => s.id === activeSlideId);

  const [showShapes, setShowShapes] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  const shapesRef = useRef(null);
  const themeRef = useRef(null);
  const imageOptionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shapesRef.current && !shapesRef.current.contains(event.target)) {
        setShowShapes(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setShowTheme(false);
      }
      if (imageOptionsRef.current && !imageOptionsRef.current.contains(event.target)) {
        setShowImageOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDebugSave = () => {
    const presentationData = usePresentationStore.getState();
    const dataToLog = {
      slides: presentationData.slides,
      // You can add other relevant top-level data here if needed, like presentation ID or title
    };
    console.log("--- DEBUG SAVE: Current Presentation JSON ---");
    console.log(JSON.stringify(dataToLog, null, 2)); // null, 2 for pretty printing
  };

  return (
    <div className="topbar-wrapper">

      {/* ================= ROW 1 ================= */}
      <div className="topbar-row topbar-row-1">

        {/* Left: Project name */}
        <div className="topbar-left">
          <input
            type="text"
            value={title || ""}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Project"
            className="project-input"
          />
        </div>

        {/* Right: Theme / Share / Agent / Present aligned in one line */}
        <div className="topbar-right">
          <div className="topbar-links">
            {/* Save Button */}
            <button
              className="nav-btn"
              disabled={pastCount === 0}
              style={{ opacity: pastCount === 0 ? 0.5 : 1, cursor: pastCount === 0 ? 'not-allowed' : 'pointer' }}
              onClick={async () => {
                try {
                  const state = usePresentationStore.getState();
                  const { presentationId, slides, title, setPresentationId } = state;

                  // Prepare payload
                  const payload = {
                    userId: user?._id,
                    title: title || "Untitled Presentation",
                    data: {
                      slides,
                    }
                  };

                  const service = await import("../../../../services/presentation");

                  if (presentationId) {
                    // Update existing
                    await service.updatePresentation(presentationId, payload);
                    alert("Presentation updated successfully!");
                  } else {
                    // Create new
                    const res = await service.savePresentation(payload);

                    const newId = res.presentationId || res._id || res.id || (res.data && (res.data._id || res.data.id));

                    if (newId) {
                      setPresentationId(newId);
                      // Update URL via navigate
                      navigate(`/presentation-editor-v3/${newId}`, { replace: true });
                      alert("Presentation saved successfully!");
                    } else {
                      alert("Presentation saved, but could not retrieve ID. Please refresh.");
                    }
                  }
                } catch (error) {
                  console.error("Save failed:", error);
                  alert("Failed to save presentation.");
                }
              }}
              data-tooltip={presentationId ? "Save Changes" : "Save"}
            >
              <Save size={18} /> {presentationId ? "Save Changes" : "Save"}
            </button>
            <div className="dropdown" ref={themeRef}>
              <button
                className="nav-btn"
                onClick={() => setShowTheme(!showTheme)}
              >
                Theme
              </button>

              {showTheme && (
                <div className="dropdown-menu">
                  <button>Blue Professional</button>
                  <button>Dark Slate</button>
                  <button>Light Minimal</button>
                </div>
              )}
            </div>

            <button className="nav-btn">Share</button>
            <button className="nav-btn" onClick={onAgentClick}>Agent</button>
          </div>

          <button onClick={onPresent} className="present-btn">
            ▶ Present
          </button>
        </div>

      </div>

      {/* ================= ROW 2 ================= */}
      <div className="topbar-row topbar-row-2">

        <div className="toolbar-center">

          {/* Undo / Redo */}
          <button onClick={undo} className="icon-btn" disabled={pastCount === 0} data-tooltip="Undo">
            <Undo2 size={18} />
          </button>

          <button onClick={redo} className="icon-btn" disabled={futureCount === 0} data-tooltip="Redo">
            <Redo2 size={18} />
          </button>

          <button onClick={copySelectedLayer} className="icon-btn" data-tooltip="Copy">
            <Copy size={18} />
          </button>

          {/* Delete */}
          <button
            onClick={deleteSelectedLayer}
            className="icon-btn icon-btn-danger"
            disabled={!selectedLayerId}
            data-tooltip="Delete"
          >
            <Trash2 size={18} />
          </button>

          {/* Text */}
          <button onClick={addTextLayer} className="icon-btn" data-tooltip="Add Text">
            <Type size={18} />
          </button>

          {/* Table */}
          <button
            onClick={() => {
              const rows = prompt("Enter rows:", "3");
              const cols = prompt("Enter columns:", "3");
              if (rows && cols) {
                addTableLayer(parseInt(rows) || 3, parseInt(cols) || 3);
              }
            }}
            className="icon-btn"
            data-tooltip="Add Table"
          >
            <Table size={18} />
          </button>

          {/* Shapes */}
          <div className="dropdown" ref={shapesRef}>
            <button
              className="icon-btn"
              onClick={() => setShowShapes(!showShapes)}
              data-tooltip="Shapes"
            >
              <Square size={18} />
              <ChevronDown size={14} />
            </button>

            {showShapes && (
              <div className="dropdown-menu">
                <button onClick={() => addShapeLayer("rect")}>
                  <Square size={16} /> Rectangle
                </button>

                <button onClick={() => addShapeLayer("circle")}>
                  <Circle size={16} /> Circle
                </button>

                <button onClick={() => addShapeLayer("line")}>
                  <Minus size={16} /> Line
                </button>
              </div>
            )}
          </div>

          {/* Image Upload */}
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

          <div className="dropdown" ref={imageOptionsRef}>
            <button
              className="icon-btn"
              onClick={() => setShowImageOptions(!showImageOptions)}
              data-tooltip="Image Options"
            >
              <ImageIcon size={18} />
              <ChevronDown size={14} />
            </button>

            {showImageOptions && (
              <div className="dropdown-menu">
                <button onClick={() => {
                  document.getElementById("image-upload").click();
                  setShowImageOptions(false);
                }}>
                  <Upload size={16} /> Upload from Computer
                </button>

                <button onClick={() => {
                  const url = prompt("Enter Image URL:");
                  if (url) {
                    addImageLayer(url);
                  }
                  setShowImageOptions(false);
                }}>
                  <Link size={16} /> Add from URL
                </button>
              </div>
            )}
          </div>

          {/* Zoom */}
          <div className="zoom-control">
            <button
              className="icon-btn"
              onClick={() => setCanvasZoom(Math.max(0.1, canvasZoom - 0.1))}
              data-tooltip="Zoom Out"
            >
              -
            </button>

            <span>{Math.round(canvasZoom * 100)}%</span>

            <button
              className="icon-btn"
              onClick={() => setCanvasZoom(Math.min(5, canvasZoom + 0.1))}
              data-tooltip="Zoom In"
            >
              +
            </button>
          </div>
        </div>

      </div>

    </div>
  );

};

export default TopBar;