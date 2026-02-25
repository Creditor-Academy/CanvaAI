import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2 } from 'react-icons/fi';
import { finalizePresentation } from '../../services/OutlineEditorService';
import './styles/OutlineEditor.css';

const OutlineEditor = ({ outlineData, onFinalize }) => {
  const navigate = useNavigate();

  const [slides, setSlides] = useState(() => {
    if (!outlineData || !outlineData.slides) return [];

    return outlineData.slides.map((slide, index) => {
      let formattedContent = { mode: 'raw', rawText: '' };

      // ✅ FIX: Handle AI structured content (bulletPoints)
      if (Array.isArray(slide.content?.bulletPoints) && slide.content.bulletPoints.length > 0) {
        formattedContent = {
          mode: 'bullets',
          bullets: slide.content.bulletPoints
        };
      }
      // If AI ever sends plain string
      else if (typeof slide.content === 'string') {
        formattedContent = {
          mode: 'raw',
          rawText: slide.content
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

        // ✅ FIX: Map image from AI structure
        image: slide.content?.images?.[0]?.url || null
      };
    });
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleTitleChange = (index, newTitle) => {
    const updated = [...slides];
    updated[index].title = newTitle;
    setSlides(updated);
  };

  const handleContentChange = (index, newContent) => {
    const updated = [...slides];

    if (newContent.includes('•')) {
      const bullets = newContent
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
        rawText: newContent
      };
    }

    setSlides(updated);
  };

  const handleInsertSlide = (index) => {
    const newSlide = {
      slideId: `slide-${Date.now()}`,
      slideNo: slides.length + 1,
      source: 'user',
      title: '',
      content: { mode: 'raw', rawText: '' },
      layout: 'content',
      contentType: 'paragraph',
      image: null
    };

    const updated = [...slides];
    updated.splice(index + 1, 0, newSlide);
    setSlides(updated);
  };

  const handleDeleteSlide = (index) => {
    if (slides.length <= 1) {
      alert('Cannot delete the last slide');
      return;
    }
    const updated = slides.filter((_, i) => i !== index);
    setSlides(updated);
  };

  const handleFinalize = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const updatedOutline = {
        ...outlineData,
        slides: slides.map(slide => ({
          slideId: slide.slideId,
          slideNo: slide.slideNo,
          source: slide.source,
          title: slide.title,
          content: slide.content,
          layout: slide.layout,
          contentType: slide.contentType,
          image: slide.image
        }))
      };

      const finalPresentation = await finalizePresentation(updatedOutline);

      onFinalize(finalPresentation);
      navigate('/presentation-editor-v3', {
  state: { presentationData: finalPresentation }
});

    } catch (error) {
      console.error('Error finalizing presentation:', error);
      setError(error.message || 'Failed to finalize presentation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getContentText = (content) => {
    if (!content) return '';
    if (content.mode === 'raw') return content.rawText || '';
    if (content.mode === 'bullets' && Array.isArray(content.bullets)) {
      return content.bullets.map(b => `• ${b}`).join('\n');
    }
    return '';
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
                      {index + 1}
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
                    value={getContentText(slide.content)}
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
                        style={{ width: '100%', marginTop: '10px', borderRadius: '8px' }}
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
                isGenerating ? 'outline-editor-finalize-button-disabled' : ''
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