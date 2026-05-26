import React, { useState, useRef, useLayoutEffect } from "react";
import { FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { finalizePresentation } from "../../services/OutlineEditorService";
import usePresentationStore from "../presentation3/store/usePresentationStore";
import { savePresentation } from "../../services/presentation";
import { useAuth } from "../../contexts/AuthContext";
import { resolvePresentationTitle } from "../../utils/presentationTitle";
import "./styles/OutlineEditor.css";

const CONTENT_CHAR_LIMIT = 2000;

const normalizeBulletText = (bullet) => {
  if (bullet == null) return "";
  if (typeof bullet === "string") return bullet;
  if (typeof bullet === "object") {
    if (typeof bullet.text === "string" && bullet.text.trim()) return bullet.text;
    if (typeof bullet.title === "string" && bullet.title.trim()) return bullet.title;
    if (typeof bullet.label === "string" && bullet.label.trim()) return bullet.label;
    const composed = [bullet.text, bullet.why, bullet.soWhat]
      .filter(Boolean)
      .map(String)
      .join("\n\n")
      .trim();
    if (composed) return composed;
    return JSON.stringify(bullet);
  }
  return String(bullet);
};

const normalizeBulletArray = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeBulletText).filter((item) => item && item.trim().length > 0);
};

/** Convert plain lines or existing bullets into a single bullet textarea value */
const formatAsBulletLines = (text) => {
  if (!text || !String(text).trim()) return "";
  return String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.match(/^[•\-\*]\s/) ? line : `• ${line.replace(/^[•\-\*]\s*/, "")}`))
    .join("\n");
};

const parseBulletsFromRawText = (rawText) => {
  if (!rawText || !String(rawText).trim()) return [];
  return String(rawText)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);
};

const buildInitialRawText = (slide) => {
  const explicitRaw = slide?.content?.rawText;
  if (typeof explicitRaw === "string" && explicitRaw.trim()) {
    return formatAsBulletLines(explicitRaw);
  }

  const bullets = normalizeBulletArray(
    slide?.bullets ||
      (Array.isArray(slide?.points) ? slide.points : []) ||
      (slide?.content?.mode === "bullets" ? slide.content.bullets : [])
  );

  if (bullets.length > 0) {
    return bullets.map((b) => `• ${b}`).join("\n");
  }

  if (typeof slide?.content === "string" && slide.content.trim()) {
    return formatAsBulletLines(slide.content);
  }

  return "";
};

const OutlineEditor = ({ outlineData, onFinalize }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;
  const textareaRefs = useRef({});

  const [slides, setSlides] = useState(() => {
    if (!outlineData?.slides) return [];

    return outlineData.slides.map((slide, index) => ({
      slideId: slide.slideId || `slide-${index + 1}`,
      slideNo: slide.slideNo || index + 1,
      source: slide.source || "ai",
      title: slide.title || "",
      content: {
        mode: "raw",
        rawText: buildInitialRawText(slide),
      },
      layout: slide.layout || "content",
      contentType: "bullets",
      image: slide.content?.images?.[0]?.url || slide.image || null,
    }));
  });

  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState(null);

  const autoResizeTextarea = (element) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    Object.values(textareaRefs.current).forEach(autoResizeTextarea);
  }, [slides]);

  const handleTitleChange = (index, value) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], title: value };
      return updated;
    });
  };

  const handleContentChange = (index, value) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        content: { mode: "raw", rawText: value },
        contentType: "bullets",
      };
      return updated;
    });
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue =
        e.target.value.substring(0, start) + "  " + e.target.value.substring(end);
      handleContentChange(index, newValue);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
        autoResizeTextarea(e.target);
      });
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      const before = value.substring(0, start);
      const after = value.substring(end);
      const prefix = before.length > 0 && !before.endsWith("\n") ? "\n" : "";
      const insertion = `${prefix}• `;
      const newValue = before + insertion + after;

      if (newValue.length <= CONTENT_CHAR_LIMIT) {
        handleContentChange(index, newValue);
        requestAnimationFrame(() => {
          const pos = start + insertion.length;
          e.target.selectionStart = e.target.selectionEnd = pos;
          autoResizeTextarea(e.target);
        });
      }
    }
  };

  const handleInsertSlide = (index) => {
    setSlides((prevSlides) => {
      const newSlide = {
        slideId: `slide-${Date.now()}`,
        slideNo: index + 2,
        source: "user",
        title: "",
        content: { mode: "raw", rawText: "• " },
        layout: "content",
        contentType: "bullets",
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

  const handleFinalize = async () => {
    if (isFinalizing) return;

    setIsFinalizing(true);
    setError(null);

    try {
      const cleanedSlides = slides.map((slide, index) => {
        const rawText = slide.content.rawText || "";
        const bullets = parseBulletsFromRawText(rawText);

        return {
          slideId: slide.slideId,
          slideNo: index + 1,
          source: slide.source || "user",
          title: slide.title || "",
          layout: slide.layout || "content",
          contentType: bullets.length > 0 ? "bullets" : "paragraph",
          content: {
            mode: "raw",
            rawText,
          },
          bullets,
          points: bullets,
          image: slide.image || null,
        };
      });

      const updatedOutline = {
        ...outlineData,
        slides: cleanedSlides,
      };

      const finalPayload = await finalizePresentation(updatedOutline);

      if (!finalPayload || !finalPayload.slides || finalPayload.slides.length === 0) {
        throw new Error("AI returned empty slides");
      }

      const presentationTitle = resolvePresentationTitle({
        topic: updatedOutline.topic,
        meta: finalPayload.meta || updatedOutline.meta,
        apiTitle:
          finalPayload.meta?.presentationTitle ||
          finalPayload.title,
      });

      const savePayload = {
        userId: currentUserId,
        title: presentationTitle,
        data: { slides: finalPayload.slides },
      };

      const saveResponse = await savePresentation(savePayload);

      const presentationId =
        saveResponse?.presentationId ||
        saveResponse?.data?._id ||
        saveResponse?.data?.id ||
        saveResponse?._id ||
        saveResponse?.id;

      if (!presentationId) {
        throw new Error("Presentation save failed");
      }

      usePresentationStore.getState().setPresentation({
        slides: finalPayload.slides,
        title: presentationTitle,
        presentationId,
        meta: finalPayload.meta || updatedOutline.meta,
      });

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
                      onChange={(e) => handleTitleChange(index, e.target.value)}
                      className="outline-editor-input"
                      placeholder="Enter slide title"
                    />

                    <button
                      onClick={() => handleDeleteSlide(index)}
                      disabled={slides.length <= 1}
                      className="outline-editor-slide-delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>

                  <div className="outline-editor-slide-body">
                    <label className="outline-editor-label" htmlFor={`slide-body-${slide.slideId}`}>
                      Bullet points
                    </label>
                    <textarea
                      id={`slide-body-${slide.slideId}`}
                      ref={(el) => {
                        textareaRefs.current[index] = el;
                        if (el) autoResizeTextarea(el);
                      }}
                      value={slide.content.rawText || ""}
                      onChange={(e) => {
                        if (e.target.value.length <= CONTENT_CHAR_LIMIT) {
                          handleContentChange(index, e.target.value);
                          autoResizeTextarea(e.target);
                        }
                      }}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="outline-editor-textarea outline-editor-textarea-bullets"
                      placeholder={"• First key point\n• Second key point\n• Third key point"}
                      maxLength={CONTENT_CHAR_LIMIT}
                      rows={1}
                    />
                    <div
                      className={`outline-editor-char-count ${
                        (slide.content.rawText || "").length >= CONTENT_CHAR_LIMIT
                          ? "outline-editor-char-count--limit"
                          : ""
                      }`}
                    >
                      {(slide.content.rawText || "").length}/{CONTENT_CHAR_LIMIT}
                    </div>
                  </div>

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
                    onClick={() => handleInsertSlide(index)}
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
              disabled={isFinalizing || slides.length === 0}
              className={`outline-editor-finalize-button ${
                isFinalizing ? "outline-editor-finalize-button-disabled" : ""
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
