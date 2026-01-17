import React from 'react';
import { Plus, ChevronLeft, Copy, Trash2, GripVertical } from 'lucide-react';

/**
 * SlidesPanel - Left sidebar showing all slide thumbnails
 * Features:
 * - Shows all slide thumbnails
 * - Highlights active slide
 * - Add / duplicate / delete slides
 * - Reorder via drag
 */
const SlidesPanel = ({
  slides,
  activeSlideId,
  onSlideSelect,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onReorderSlides,
  isVisible,
  onToggleVisibility,
  draggedSlideId,
  setDraggedSlideId,
  dragOverSlideId,
  setDragOverSlideId,
}) => {
  if (!isVisible) return null;

  return (
    <aside
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '12px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        minHeight: 0,
        maxHeight: '100%',
      }}
      className="custom-scrollbar"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>Slides</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onAddSlide}
            title="Add slide"
            style={{
              border: 'none',
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#4f46e5',
              borderRadius: 10,
              padding: '4px',
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
          </button>
          <button
            onClick={onToggleVisibility}
            title="Hide slides panel"
            style={{
              border: 'none',
              background: 'rgba(15, 23, 42, 0.06)',
              color: '#475569',
              borderRadius: 10,
              padding: '4px',
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>

      <div
        className="custom-scrollbar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          overflowX: 'hidden',
          flex: 1,
          minHeight: 0,
          paddingRight: '4px',
        }}
      >
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId;
          const isDragging = draggedSlideId === slide.id;
          const isDragOver = dragOverSlideId === slide.id;

          return (
            <div
              key={slide.id}
              draggable
              onDragStart={() => setDraggedSlideId(slide.id)}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedSlideId && draggedSlideId !== slide.id) {
                  setDragOverSlideId(slide.id);
                }
              }}
              onDragLeave={() => {
                if (dragOverSlideId === slide.id) {
                  setDragOverSlideId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedSlideId && draggedSlideId !== slide.id) {
                  onReorderSlides(draggedSlideId, slide.id);
                }
                setDraggedSlideId(null);
                setDragOverSlideId(null);
              }}
              onDragEnd={() => {
                setDraggedSlideId(null);
                setDragOverSlideId(null);
              }}
              style={{
                borderRadius: 12,
                padding: '8px',
                background: isActive ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : '#f8fafc',
                color: isActive ? '#ffffff' : '#0f172a',
                cursor: isDragging ? 'grabbing' : 'grab',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'transform 150ms ease, opacity 150ms ease',
                opacity: isDragging ? 0.5 : 1,
                transform: isDragOver ? 'translateY(4px)' : 'translateY(0)',
                border: isDragOver ? '2px dashed rgba(251, 191, 36, 0.5)' : '2px solid transparent',
                marginBottom: isDragOver ? '8px' : '0',
              }}
              onClick={() => onSlideSelect(slide.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GripVertical
                    size={14}
                    style={{
                      color: isActive ? 'rgba(255, 255, 255, 0.6)' : '#94a3b8',
                      cursor: 'grab',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>Slide {index + 1}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onDuplicateSlide(slide);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: isActive ? '#e0e7ff' : '#6366f1',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      padding: 4,
                      borderRadius: 6,
                    }}
                    title="Duplicate slide"
                  >
                    <Copy size={14} />
                  </button>
                  {slides.length > 1 && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteSlide(slide.id);
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: isActive ? '#fca5a5' : '#ef4444',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        padding: 4,
                        borderRadius: 6,
                      }}
                      title="Delete slide"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div
                style={{
                  borderRadius: 10,
                  background: '#ffffff',
                  height: 70,
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '8px',
                    borderRadius: 8,
                    background: slide.background,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                  }}
                >
                  {slide.layers.length ? `${slide.layers.length} elements` : 'Empty'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default SlidesPanel;
