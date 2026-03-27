import React, { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { finalizePresentation } from "../../services/OutlineEditorService";
import { savePresentation } from "../../services/presentation";
import { useAuth } from "../../contexts/AuthContext";
import "./styles/OutlineEditor.css";

const OutlineEditor = ({ outlineData, onFinalize }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;

  const [slides, setSlides] = useState(() => {
    if (!outlineData?.slides) return [];

    return outlineData.slides.map((slide, index) => ({
      slideId: slide.slideId || `slide-${index + 1}`,
      slideNo: slide.slideNo || index + 1,
      source: slide.source || "ai",
      title: slide.title || "",
      content: {
        mode: "raw",
        rawText: slide.content?.rawText || "",
      },
      bullets: slide.bullets || [],
      layout: slide.layout || "content",
      contentType: slide.contentType || "paragraph",
      image:
        slide.content?.images?.[0]?.url || slide.image || null,
    }));
  });

  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Title Change
  const handleTitleChange = (index, value) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        title: value,
      };
      return updated;
    });
  };

  // ✅ Smooth Content Change
  const handleContentChange = (index, value) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        content: {
          mode: "raw",
          rawText: value,
        },
      };
      return updated;
    });
  };

  // ✅ Tab Support (2 spaces)
  const handleKeyDown = (e, index) => {
    if (e.key === "Tab") {
      e.preventDefault();

      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      const newValue =
        e.target.value.substring(0, start) +
        "  " +
        e.target.value.substring(end);

      handleContentChange(index, newValue);

      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd =
          start + 2;
      });
    }
  };

  // ✅ Auto Resize
  const autoResizeTextarea = (element) => {
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
  };

  // ✅ Insert Slide
  const handleInsertSlide = (index) => {
    setSlides((prevSlides) => {
      const newSlide = {
        slideId: `slide-${Date.now()}`,
        slideNo: index + 2,
        source: "user",
        title: "",
        content: { mode: "raw", rawText: "" },
        layout: "content",
        contentType: "paragraph",
        image: null,
      };

      const updated = [...prevSlides];
      updated.splice(index + 1, 0, newSlide);

      updated.forEach((slide, i) => {
        slide.slideNo = i + 1;
      });

      return updated;
    });
  };

  // ✅ Delete Slide
  const handleDeleteSlide = (index) => {
    if (slides.length <= 1) {
      alert("Cannot delete the last slide");
      return;
    }

    const updated = slides.filter((_, i) => i !== index);
    updated.forEach((slide, i) => {
      slide.slideNo = i + 1;
    });

    setSlides(updated);
  };

  // ✅ Finalize
  const handleFinalize = async () => {
    if (isFinalizing) return;

    setIsFinalizing(true);
    setError(null);

    try {
      const cleanedSlides = slides.map((slide, index) => ({
        slideId: slide.slideId,
        slideNo: index + 1,
        source: slide.source || "user",
        title: slide.title || "",
        layout: slide.layout || "content",
        contentType: slide.contentType || "paragraph",
        content: {
          mode: "raw",
          rawText: slide.content.rawText || "",
        },
        bullets: slide.bullets || [],
        image: slide.image || null,
      }));

      const updatedOutline = {
        ...outlineData,
        slides: cleanedSlides,
      };

      const finalPresentation = await finalizePresentation(updatedOutline);

      if (!finalPresentation?.slides?.length) {
        throw new Error("AI returned empty slides");
      }

      const pSlides = finalPresentation.slides;

      const firstSlideTitle =
        pSlides?.[0]?.title?.trim() ||
        finalPresentation?.meta?.topic ||
        "Untitled Presentation";

      const payload = {
        userId: currentUserId,
        title: firstSlideTitle,
        data: { slides: pSlides }
      };

      const saveResponse = await savePresentation(payload);

      const presentationId =
        saveResponse?.presentationId || saveResponse?.data?._id || saveResponse?.data?.id || saveResponse?._id || saveResponse?.id;

      if (!presentationId) {
        throw new Error("Presentation save failed");
      }

      navigate(`/presentation-editor-v3/${presentationId}`);

      if (onFinalize) {
        onFinalize(null);
      }
    } catch (err) {
      console.error("Finalize flow failed:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="outline-editor">
      <div className="outline-editor-container">
        <div className="outline-editor-content">
          <div className="outline-editor-slides">
            {slides.map((slide, index) => (
              <React.Fragment key={slide.slideId}>
                <div className="outline-editor-slide">
                  <div className="outline-editor-slide-header">
                    <div className="outline-editor-slide-number">
                      {slide.slideNo}
                    </div>

                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) =>
                        handleTitleChange(
                          index,
                          e.target.value
                        )
                      }
                      className="outline-editor-input"
                      placeholder="Enter slide title"
                    />

                    <button
                      onClick={() =>
                        handleDeleteSlide(index)
                      }
                      disabled={slides.length <= 1}
                      className="outline-editor-slide-delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>

                  <textarea
                    value={slide.content.rawText || ""}
                    onChange={(e) => {
                      if (e.target.value.length <= 200) {
                        handleContentChange(
                          index,
                          e.target.value
                        );
                        autoResizeTextarea(e.target);
                      }
                    }}
                    onKeyDown={(e) =>
                      handleKeyDown(e, index)
                    }
                    className="outline-editor-textarea"
                    placeholder="Enter slide content"
                    maxLength={200}
                    rows={4}
                  />
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: "12px",
                      marginTop: "4px",
                      color:
                        (slide.content.rawText || "").length >= 200
                          ? "#e53e3e"
                          : "#888",
                    }}
                  >
                    {(slide.content.rawText || "").length}/200
                  </div>

                  {slide.bullets && slide.bullets.length > 0 && (
                    <div className="outline-editor-bullets-container">
                      <div className="outline-editor-label">Bullet Points</div>
                      <ul className="outline-editor-bullets-list">
                        {slide.bullets.map((bullet, i) => (
                          <li key={i} className="outline-editor-bullet-item">{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {slide.image && (
                    <div className="outline-editor-image-preview">
                      <img
                        src={slide.image}
                        alt="Slide Visual"
                        style={{
                          width: "100%",
                          marginTop: "10px",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="slide-insert-wrapper">
                  <button
                    className="slide-insert-btn"
                    onClick={() =>
                      handleInsertSlide(index)
                    }
                  >
                    +
                  </button>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="outline-editor-finalize">
            {error && (
              <div className="outline-editor-error">
                <strong>Error:</strong> {error}
              </div>
            )}

            <button
              onClick={handleFinalize}
              disabled={
                isFinalizing || slides.length === 0
              }
              className={`outline-editor-finalize-button ${isFinalizing
                ? "outline-editor-finalize-button-disabled"
                : ""
                }`}
            >
              {isFinalizing && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="outline-editor-spin"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              {isFinalizing
                ? "Generating Final Presentation..."
                : "Generate Final Presentation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutlineEditor;