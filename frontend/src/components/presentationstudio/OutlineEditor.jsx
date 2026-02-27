import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2 } from 'react-icons/fi';
import { finalizePresentation } from '../../services/OutlineEditorService';
import './styles/OutlineEditor.css';

const OutlineEditor = ({ outlineData, onFinalize }) => {
  const navigate = useNavigate();

  // ✅ Initialize Slides From outlineData
  const [slides, setSlides] = useState(() => {
    if (!outlineData?.slides) return [];
console.log("Initializing slides from outlineData:", outlineData);
    return outlineData.slides.map((slide, index) => {
      let formattedContent = { mode: 'raw', rawText: '' };

      if (Array.isArray(slide.bullets) && slide.bullets.length > 0) {
        formattedContent = {
          mode: 'bullets',
          bullets: slide.bullets
        };
      } else if (slide.content?.rawText) {
        formattedContent = {
          mode: 'raw',
          rawText: slide.content.rawText
        };
      }

      return {
        slideId: slide.slideId || `slide-${index + 1}`,
        slideNo: slide.slideNo || index + 1,
        source: slide.source || 'ai',
        title: slide.title || '',
        content: formattedContent,
        layout: slide.layout || 'content',
        contentType: slide.contentType || 'paragraph',
        image: slide.content?.images?.[0]?.url || slide.image || null
      };
    });
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Title Update
  const handleTitleChange = (index, value) => {
    const updated = [...slides];
    updated[index].title = value;
    setSlides(updated);
  };

  // ✅ Content Update (auto detect bullets)
  const handleContentChange = (index, value) => {
    const updated = [...slides];

    if (value.includes('•')) {
      const bullets = value
        .split('\n')
        .map(line => line.replace('•', '').trim())
        .filter(Boolean);

      updated[index].content = {
        mode: 'bullets',
        bullets
      };
    } else {
      updated[index].content = {
        mode: 'raw',
        rawText: value
      };
    }

    setSlides(updated);
  };

  // ✅ Insert Slide
  const handleInsertSlide = (index) => {
    setSlides((prevSlides) => {
      const newSlide = {
        slideId: `slide-${Date.now()}`,
        slideNo: index + 2,
        source: 'user',
        title: '',
        content: { mode: 'raw', rawText: '' },
        layout: 'content',
        contentType: 'paragraph',
        image: null
      };

      const updated = [...prevSlides];
      updated.splice(index + 1, 0, newSlide);

      // Recalculate slide numbers
      updated.forEach((slide, i) => {
        slide.slideNo = i + 1;
      });

      return updated;
    });
  };

  // ✅ Delete Slide
  const handleDeleteSlide = (index) => {
    if (slides.length <= 1) {
      alert('Cannot delete the last slide');
      return;
    }

    const updated = slides.filter((_, i) => i !== index);

    // Recalculate slide numbers
    updated.forEach((slide, i) => {
      slide.slideId = i + 1;
    });

    setSlides(updated);
  };

  // ✅ Finalize
 const handleFinalize = async () => {
  if (isGenerating) return;

  setIsGenerating(true);
  setError(null);

  try {
    // ✅ Build fresh slides array from state ONLY
    const cleanedSlides = slides.map((slide, index) => {
      return {
        slideId: slide.slideId,
        slideNo: index + 1,
        source: slide.source || "user",
        title: slide.title || "",
        layout: slide.layout || "content",
        contentType: slide.contentType || "paragraph",
        content:
          slide.content.mode === "bullets"
            ? {
                mode: "bullets",
                rawText: slide.content.bullets.join("\n"),
                bullets: slide.content.bullets
              }
            : {
                mode: "raw",
                rawText: slide.content.rawText || ""
              },
        bullets:
          slide.content.mode === "bullets"
            ? slide.content.bullets
            : [],
        image: slide.image || null
      };
    });

    // ✅ IMPORTANT: completely override slides
    const updatedOutline = {
      ...outlineData,
      slides: cleanedSlides
    };

    console.log("Slides being sent to backend:", cleanedSlides);

    const finalPresentation = await finalizePresentation(updatedOutline);
  console.log("Final presentation response from backend:", finalPresentation);
    onFinalize(finalPresentation);

    navigate("/presentation-editor-v3", {
      state: { presentationData: finalPresentation }
    });

  } catch (err) {
    console.error("Finalize Error:", err);
    setError(err.message || "Failed to finalize presentation.");
  } finally {
    setIsGenerating(false);
  }
};

  // ✅ Get Textarea Value
  const getTextareaValue = (content) => {
    if (!content) return '';

    if (content.mode === 'bullets') {
      return content.bullets?.map(b => `• ${b}`).join('\n') || '';
    }

    return content.rawText || '';
  };

  return (
    <div className="outline-editor">
      <div className="outline-editor-container">
        <div className="outline-editor-content">
          <div className="outline-editor-slides">

            {/* ✅ IMPORTANT: render from slides state */}
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
                        handleTitleChange(index, e.target.value)
                      }
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

                  <textarea
                    value={getTextareaValue(slide.content)}
                    onChange={(e) =>
                      handleContentChange(index, e.target.value)
                    }
                    className="outline-editor-textarea"
                    placeholder="Enter slide content"
                    rows={4}
                  />

                  {slide.image && (
                    <div className="outline-editor-image-preview">
                      <img
                        src={slide.image}
                        alt="Slide Visual"
                        style={{
                          width: '100%',
                          marginTop: '10px',
                          borderRadius: '8px'
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
              disabled={isGenerating || slides.length === 0}
              className={`outline-editor-finalize-button ${
                isGenerating
                  ? 'outline-editor-finalize-button-disabled'
                  : ''
              }`}
            >
              {isGenerating
                ? 'Generating Final Presentation...'
                : 'Generate Final Presentation'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OutlineEditor;