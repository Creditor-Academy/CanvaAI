import React, { useState } from "react";
import usePresentationStore from "../../store/usePresentationStore";
import {
  Type, Square, Image as ImageIcon, Grid3x3,
  Layers, Settings, ChevronDown, ChevronRight,
  AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline,
  ArrowUp, ArrowDown, Move
} from 'lucide-react';
import '../../globals.css';

const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--editor-border)', paddingBottom: '8px', marginBottom: '8px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '8px 4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--editor-text)',
          fontWeight: 600,
          fontSize: '13px'
        }}
      >
        {Icon && <Icon size={16} style={{ marginRight: '8px', opacity: 0.7 }} />}
        <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && <div style={{ padding: '4px' }}>{children}</div>}
    </div>
  );
};

const PropertiesPanel = () => {
  const {
    slides, activeSlideId, getSelectedLayer,
    updateSlideBackground, updateTextLayer, updateShapeLayer,
    setTextAlignment, toggleBold, toggleItalic, toggleUnderline,
    setSlideBackgroundImage, reorderLayer, updateLayerRotation,
    alignLayer, addTableRow, addTableColumn,
  } = usePresentationStore();

  const activeSlide = slides.find((slide) => slide.id === activeSlideId);
  const selectedLayer = getSelectedLayer();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!activeSlide) return null;

  if (isCollapsed) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '110px', right: '20px',
          width: '40px', height: '40px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-floating)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 40
        }}
        onClick={() => setIsCollapsed(false)}
        title="Open Properties"
      >
        <Settings size={20} />
      </div>
    );
  }

  return (
    <div style={{
      width: '280px',
      maxHeight: 'calc(100vh - 120px)',
      position: 'absolute',
      top: '110px',
      right: '20px',
      background: 'var(--editor-panel-bg)',
      borderRadius: '12px',
      boxShadow: 'var(--shadow-floating)',
      padding: '12px',
      overflowY: 'auto',
      zIndex: 40,
      display: 'flex', flexDirection: 'column'
    }} className="custom-scrollbar">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--editor-border)' }}>
        <span style={{ fontWeight: 600 }}>Properties</span>
        <button onClick={() => setIsCollapsed(true)} className="editor-btn-icon" style={{ width: 24, height: 24 }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* NO SELECTION -> SLIDE PROPERTIES */}
      {!selectedLayer && (
        <Section title="Slide Background" icon={ImageIcon}>
          <div className="control-group">
            <label>Color</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="color"
                value={activeSlide.background}
                onChange={(e) => updateSlideBackground(activeSlideId, e.target.value)}
                style={{ width: '30px', height: '30px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', color: '#666' }}>{activeSlide.background}</span>
            </div>
          </div>

          <div className="control-group">
            <label>Image</label>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <button className="editor-btn-secondary" onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setSlideBackgroundImage(activeSlideId, reader.result);
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}>Upload</button>
              <button className="editor-btn-secondary" onClick={() => {
                const url = prompt("Enter image URL:");
                if (url) setSlideBackgroundImage(activeSlideId, url);
              }}>URL</button>
            </div>
            {activeSlide.backgroundImage && (
              <button
                className="editor-btn-secondary"
                style={{ color: '#ef4444', borderColor: '#ef4444', width: '100%' }}
                onClick={() => setSlideBackgroundImage(activeSlideId, null)}
              >
                Remove Image
              </button>
            )}
          </div>
        </Section>
      )}

      {/* SELECTION -> LAYER PROPERTIES */}
      {selectedLayer && (
        <>
          <Section title="Arrange" icon={Layers}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <button className="editor-btn-secondary" onClick={() => reorderLayer(selectedLayer.id, "forward")}>
                Bring Forward
              </button>
              <button className="editor-btn-secondary" onClick={() => reorderLayer(selectedLayer.id, "backward")}>
                Send Backward
              </button>
            </div>

            <div className="control-group">
              <label>Alignment</label>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8f9fa', padding: '4px', borderRadius: '6px' }}>
                {['left', 'center', 'right'].map(align => (
                  <button key={align} className="editor-btn-icon" onClick={() => alignLayer(selectedLayer.id, align)} title={`Align ${align}`}>
                    <AlignLeft size={16} style={{ transform: align === 'center' ? 'rotate(90deg)' : align === 'right' ? 'rotate(180deg)' : 'none' }} />
                    {/* Using AlignLeft rotated as a quick hack or use specific icons if imported */}
                  </button>
                ))}
                {['top', 'bottom'].map(align => (
                  <button key={align} className="editor-btn-icon" onClick={() => alignLayer(selectedLayer.id, align)} title={`Align ${align}`}>
                    {align === 'top' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {selectedLayer.type === "shape" && (
            <Section title="Shape" icon={Square}>
              <div className="control-group">
                <label>Fill / Stroke</label>
                <input
                  type="color"
                  value={['line', 'arrow'].includes(selectedLayer.shapeType) ? selectedLayer.stroke : selectedLayer.fill}
                  onChange={(e) => updateShapeLayer(selectedLayer.id, {
                    [['line', 'arrow'].includes(selectedLayer.shapeType) ? "stroke" : "fill"]: e.target.value
                  })}
                  style={{ width: '100%', height: '36px', cursor: 'pointer' }}
                />
              </div>
            </Section>
          )}

          {selectedLayer.type === "text" && (
            <Section title="Typography" icon={Type}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '8px', marginBottom: '8px' }}>
                <select
                  value={selectedLayer.fontFamily}
                  onChange={(e) => updateTextLayer(selectedLayer.id, { fontFamily: e.target.value })}
                  className="editor-select"
                >
                  {["Arial", "Helvetica", "Times New Roman", "Georgia", "Courier New", "Verdana"].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={selectedLayer.fontSize}
                  onChange={(e) => updateTextLayer(selectedLayer.id, { fontSize: Number(e.target.value) })}
                  className="editor-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                <button className={`editor-btn-toggle ${selectedLayer.fontWeight === 'bold' ? 'active' : ''}`} onClick={() => toggleBold(selectedLayer.id)}>
                  <Bold size={16} />
                </button>
                <button className={`editor-btn-toggle ${selectedLayer.fontStyle === 'italic' ? 'active' : ''}`} onClick={() => toggleItalic(selectedLayer.id)}>
                  <Italic size={16} />
                </button>
                <button className={`editor-btn-toggle ${selectedLayer.textDecoration === 'underline' ? 'active' : ''}`} onClick={() => toggleUnderline(selectedLayer.id)}>
                  <Underline size={16} />
                </button>
                <div style={{ width: 1, background: '#e5e7eb', margin: '0 4px' }} />
                <input type="color" value={selectedLayer.color} onChange={(e) => updateTextLayer(selectedLayer.id, { color: e.target.value })} style={{ width: 32, height: 32, padding: 0, border: 'none', background: 'none' }} />
              </div>

              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    className={`editor-btn-toggle ${selectedLayer.textAlign === align ? 'active' : ''}`}
                    onClick={() => setTextAlignment(selectedLayer.id, align)}
                    style={{ flex: 1, border: 'none' }}
                  >
                    {align === 'left' && <AlignLeft size={16} />}
                    {align === 'center' && <AlignCenter size={16} />}
                    {align === 'right' && <AlignRight size={16} />}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {selectedLayer.type === "table" && (
            <Section title="Table" icon={Grid3x3}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button className="editor-btn-secondary" style={{ flex: 1 }} onClick={() => addTableRow(selectedLayer.id)}>+ Row</button>
                <button className="editor-btn-secondary" style={{ flex: 1 }} onClick={() => addTableColumn(selectedLayer.id)}>+ Col</button>
              </div>
              <div className="control-group">
                <label>Border Color</label>
                <input type="color" value={selectedLayer.borderColor || "#d1d5db"} onChange={e => updateTextLayer(selectedLayer.id, { borderColor: e.target.value })} style={{ width: '100%', height: '32px' }} />
              </div>
            </Section>
          )}

          {selectedLayer.type === "image" && (
            <Section title="Image Details" icon={ImageIcon}>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Width: {Math.round(selectedLayer.width)}px <br />
                Height: {Math.round(selectedLayer.height)}px
              </div>
            </Section>
          )}
        </>
      )}

      <style>{`
        .control-group { margin-bottom: 12px; }
        .control-group label { display: block; font-size: 11px; font-weight: 500; color: #6b7280; marginBottom: 4px; }
        
        .editor-btn-secondary {
            padding: 6px 10px;
            background: white;
            border: 1px solid var(--editor-border);
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .editor-btn-secondary:hover { background: #f9fafb; border-color: #cbd5e1; }
        
        .editor-select, .editor-input {
            width: 100%;
            padding: 6px;
            border: 1px solid var(--editor-border);
            border-radius: 4px;
            font-size: 13px;
        }
        
        .editor-btn-toggle {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid transparent;
            background: transparent;
            border-radius: 4px;
            cursor: pointer;
            color: #4b5563;
        }
        .editor-btn-toggle:hover { background: #e5e7eb; }
        .editor-btn-toggle.active { background: #dbeafe; color: #2563eb; }
      `}</style>

    </div>
  );
};

export default PropertiesPanel;