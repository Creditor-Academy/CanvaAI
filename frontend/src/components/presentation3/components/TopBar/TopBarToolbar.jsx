import React from 'react';
import {
    Undo2, Redo2, Clipboard, Type, Grid3x3,
    Square, Image as ImageIcon, PaintBucket,
    Minus, Plus
} from 'lucide-react';
import usePresentationStore from '../../store/usePresentationStore';
import '../../globals.css';

const TopBarToolbar = () => {
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

    const handleAddImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => addImageLayer(reader.result);
            reader.readAsDataURL(file);
        };
        input.click();
    };

    const handleAddTable = () => {
        const rows = prompt("Enter rows:", "3");
        const cols = prompt("Enter columns:", "3");
        if (rows && cols) addTableLayer(parseInt(rows), parseInt(cols));
    };

    return (
        <div style={{
            position: 'absolute',
            top: '60px', /* Below Row 1 with slight overlap if needed */
            left: '50%',
            transform: 'translateX(-50%)',
            height: '48px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-floating)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: '4px',
            zIndex: 100
        }}>
            {/* History */}
            <button
                className="editor-btn-icon"
                onClick={undo}
                disabled={pastCount === 0}
                style={{ opacity: pastCount === 0 ? 0.4 : 1 }}
            >
                <Undo2 size={18} />
            </button>
            <button
                className="editor-btn-icon"
                onClick={redo}
                disabled={futureCount === 0}
                style={{ opacity: futureCount === 0 ? 0.4 : 1 }}
            >
                <Redo2 size={18} />
            </button>

            <div className="divider" />

            {/* Clipboard */}
            <button className="editor-btn-icon" onClick={copySelectedLayer} title="Copy">
                <Clipboard size={18} />
            </button>

            <div className="divider" />

            {/* Tools */}
            <button className="editor-btn-icon" onClick={addTextLayer} title="Text">
                <Type size={18} />
            </button>
            <button className="editor-btn-icon" onClick={handleAddTable} title="Table">
                <Grid3x3 size={18} />
            </button>
            <button className="editor-btn-icon" onClick={() => addShapeLayer('rect')} title="Shape">
                <Square size={18} />
            </button>
            <button className="editor-btn-icon" onClick={handleAddImage} title="Image">
                <ImageIcon size={18} />
            </button>
            <button className="editor-btn-icon" title="Background">
                <PaintBucket size={18} />
            </button>

            <div className="divider" />

            {/* Zoom */}
            <button
                className="editor-btn-icon"
                onClick={() => setCanvasZoom(Math.max(0.1, canvasZoom - 0.1))}
            >
                <Minus size={16} />
            </button>

            <span style={{
                width: '48px',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--editor-text)'
            }}>
                {Math.round(canvasZoom * 100)}%
            </span>

            <button
                className="editor-btn-icon"
                onClick={() => setCanvasZoom(Math.min(5, canvasZoom + 0.1))}
            >
                <Plus size={16} />
            </button>

            <style>{`
        .divider {
          width: 1px;
          height: 24px;
          background: #e5e7eb;
          margin: 0 6px;
        }
      `}</style>
        </div>
    );
};

export default TopBarToolbar;
