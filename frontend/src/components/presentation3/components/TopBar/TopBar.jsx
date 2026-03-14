import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import usePresentationStore from "../../store/usePresentationStore";
import { useUIStore } from "../../store/useUIStore";
import { withHybridLoader } from "../../utils/withHybridLoader";
import "./topbar.css";
import {
  Undo2,
  Redo2,
  Copy,
  Type,
  Table,
  Square,
  Circle,
  Plus,
  Minus,
  Image as ImageIcon,
  Play,
  ChevronDown,
  Upload,
  Link,
  Trash2,
  Save,
  Download,
  Triangle,
  Diamond,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Sparkles
} from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import useImageUpload from "../../hooks/useImageUpload";

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

  const { uploadFile, isUploading } = useImageUpload();

  const activeSlide = slides.find((s) => s.id === activeSlideId);

  const [showShapes, setShowShapes] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showTablePopup, setShowTablePopup] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);


  const shapesRef = useRef(null);
  const themeRef = useRef(null);
  const imageOptionsRef = useRef(null);
  const downloadRef = useRef(null);
  const tablePopupRef = useRef(null);

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
      if (downloadRef.current && !downloadRef.current.contains(event.target)) {
        setShowDownload(false);
      }
      if (tablePopupRef.current && !tablePopupRef.current.contains(event.target)) {
        setShowTablePopup(false);
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

  const handleAddImageFromUrl = () => {
    if (imageUrlInput.trim()) {
      addImageLayer(imageUrlInput);
      setImageUrlInput("");
      setShowUrlModal(false);
    }
  };

  return (
    <div className="topbar-wrapper">

      {/* ================= ROW 1 ================= */}
      <div className="topbar-row topbar-row-1">

        {/* Left: Project name */}
        <div className="topbar-left">
          {/* Brand Icon (Google Slides Style) */}
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" className="topbar-brand-icon">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" stroke="#CCCCCC" strokeWidth="0.816">
              <path fill="none" stroke="#f8b21a" strokeWidth="1.176" d="M4.99787498,8.99999999 L4.99787498,0.999999992 L19.4999998,0.999999992 L22.9999998,4.50000005 L23,23 L4,23 M18,1 L18,6 L23,6 M4,12 L4.24999995,12 L5.49999995,12 C7.5,12 9,12.5 8.99999995,14.25 C8.9999999,16 7.5,16.5 5.49999995,16.5 L4.24999995,16.5 L4.24999995,19 L4,18.9999999 L4,12 Z"></path>
            </g>
            <g id="SVGRepo_iconCarrier">
              <path fill="none" stroke="#f8b21a" strokeWidth="1.176" d="M4.99787498,8.99999999 L4.99787498,0.999999992 L19.4999998,0.999999992 L22.9999998,4.50000005 L23,23 L4,23 M18,1 L18,6 L23,6 M4,12 L4.24999995,12 L5.49999995,12 C7.5,12 9,12.5 8.99999995,14.25 C8.9999999,16 7.5,16.5 5.49999995,16.5 L4.24999995,16.5 L4.24999995,19 L4,18.9999999 L4,12 Z"></path>
            </g>
          </svg>
          <input
            type="text"
            value={title || ""}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUnsavedChanges(true);
            }}
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
              disabled={pastCount === 0 && !hasUnsavedChanges}
              style={{
                opacity: (pastCount === 0 && !hasUnsavedChanges) ? 0.5 : 1,
                cursor: (pastCount === 0 && !hasUnsavedChanges) ? 'not-allowed' : 'pointer'
              }}
              onClick={async () => {
                const { addNotification } = useUIStore.getState();

                try {
                  await withHybridLoader(
                    async () => {
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
                        addNotification("Changes saved successfully!", "success");
                      } else {
                        // Create new
                        const res = await service.savePresentation(payload);

                        const newId = res.presentationId || res._id || res.id || (res.data && (res.data._id || res.data.id));

                        if (newId) {
                          setPresentationId(newId);
                          // Update URL via navigate
                          navigate(`/presentation-editor-v3/${newId}`, { replace: true });
                          addNotification("Presentation saved successfully!", "success");
                        } else {
                          addNotification("Presentation saved, but could not retrieve ID. Please refresh.", "warning");
                        }
                      }

                      setHasUnsavedChanges(false);
                      return { success: true };
                    },
                    "top",
                    presentationId ? "Saving changes..." : "Saving presentation..."
                  );
                } catch (error) {
                  console.error("Save failed:", error);
                  addNotification("Failed to save presentation.", "error");
                }
              }}
              data-tooltip={presentationId ? "Save Changes" : "Save"}
            >
              <Save size={18} /> {presentationId ? "Save Changes" : "Save"}
            </button>

            {/* Download Button */}
            <div className="dropdown" ref={downloadRef}>
              <button
                className="nav-btn"
                onClick={() => setShowDownload(!showDownload)}
                title="Download Presentation"
              >
                <Download size={18} /> Download
              </button>

              {showDownload && (
                <div className="dropdown-menu">
                  <button
                    disabled={!presentationId}
                    onClick={async () => {
                      await withHybridLoader(
                        async () => {
                          const service = await import("../../../../services/presentation");
                          await service.exportPresentation(presentationId, "pdf");
                        },
                        "top",
                        "Exporting to PDF..."
                      );
                      setShowDownload(false);
                    }}>
                    PDF Document (.pdf)
                  </button>
                  <button
                    disabled={!presentationId}
                    onClick={async () => {
                      await withHybridLoader(
                        async () => {
                          const service = await import("../../../../services/presentation");
                          await service.exportPresentation(presentationId, "pptx");
                        },
                        "top",
                        "Exporting to PPTX..."
                      );
                      setShowDownload(false);
                    }}>
                    PowerPoint (.pptx)
                  </button>
                </div>
              )}
            </div>
            {/* 
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

            <button className="nav-btn">Share</button> */}
            <button className="nav-btn agent-nav-btn" onClick={onAgentClick}>
              <Sparkles size={18} /> Agent
            </button>
          </div>

          <button onClick={onPresent} className="present-btn">
            <Play size={18} fill="currentColor" /> Present
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
          <div className="dropdown" ref={tablePopupRef}>
            <button
              onClick={() => setShowTablePopup(!showTablePopup)}
              className="icon-btn"
              data-tooltip="Add Table"
            >
              <Table size={18} />
              <ChevronDown size={14} />
            </button>

            {showTablePopup && (
              <div className="dropdown-menu table-popup">
                <div className="table-popup-header">
                  <span>Insert Table</span>
                </div>
                <div className="table-popup-content">
                  <div className="table-input-group">
                    <label>Rows</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={tableRows}
                      onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="table-input-group">
                    <label>Columns</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={tableCols}
                      onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <button
                    className="primary-btn table-add-btn"
                    style={{ backgroundColor: "#2563eb", color: "#fff" }}
                    onClick={() => {
                      addTableLayer(tableRows, tableCols);
                      setShowTablePopup(false);
                    }}
                  >
                    Add Table
                  </button>
                </div>
              </div>
            )}
          </div>

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
              <div className="dropdown-menu shapes-dropdown">
                <button onClick={() => addShapeLayer("rect")}>
                  <Square size={16} /> Rectangle
                </button>

                <button onClick={() => addShapeLayer("roundedRect")}>
                  <Square size={16} style={{ borderRadius: '4px' }} /> Rounded Rect
                </button>

                <button onClick={() => addShapeLayer("circle")}>
                  <Circle size={16} /> Circle
                </button>

                <button onClick={() => addShapeLayer("triangle")}>
                  <Triangle size={16} /> Triangle
                </button>

                <button onClick={() => addShapeLayer("diamond")}>
                  <Diamond size={16} /> Diamond
                </button>

                <button onClick={() => addShapeLayer("line")}>
                  <Minus size={16} /> Line
                </button>

                <div className="dropdown-divider" />

                <button onClick={() => addShapeLayer("arrowRight")}>
                  <ArrowRight size={16} /> Right Arrow
                </button>

                <button onClick={() => addShapeLayer("arrowLeft")}>
                  <ArrowLeft size={16} /> Left Arrow
                </button>

                <button onClick={() => addShapeLayer("arrowUp")}>
                  <ArrowUp size={16} /> Up Arrow
                </button>

                <button onClick={() => addShapeLayer("arrowDown")}>
                  <ArrowDown size={16} /> Down Arrow
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
            disabled={isUploading}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;

              try {
                await withHybridLoader(
                  async () => {
                    // presentationId might be null for new presentations
                    const pptId = presentationId || "new";
                    const { url, key } = await uploadFile(file, user?._id, pptId);

                    // Add the image layer with S3 URL and Key
                    // We don't store base64 in the store
                    addImageLayer(null, url, key);

                    e.target.value = "";

                    return { url, key };
                  },
                  "top",
                  "Uploading image..."
                );
              } catch (error) {
                alert("Failed to upload image.");
              }
            }}
          />

          {/* URL Input Modal */}
          {showUrlModal && (
            <div className="modal-overlay" onClick={() => setShowUrlModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Add Image from URL</h3>
                <input
                  type="url"
                  placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="url-input-field"
                />
                <div className="modal-buttons">
                  <button
                    className="secondary-btn"
                    onClick={() => setShowUrlModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-btn"
                    onClick={handleAddImageFromUrl}
                    disabled={!imageUrlInput.trim()}
                  >
                    Add Image
                  </button>
                </div>
              </div>
            </div>
          )}



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
                  setShowUrlModal(true);
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
              <Minus size={16} />
            </button>

            <span>{Math.round(canvasZoom * 100)}%</span>

            <button
              className="icon-btn"
              onClick={() => setCanvasZoom(Math.min(5, canvasZoom + 0.1))}
              data-tooltip="Zoom In"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );

};

export default TopBar;