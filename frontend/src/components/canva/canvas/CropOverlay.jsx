import React, { useState, useCallback, useEffect } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

const CropOverlay = ({ layer, onApply, onCancel, zoom }) => {
    const [cropRect, setCropRect] = useState({
        x: 0,
        y: 0,
        width: layer.width,
        height: layer.height
    });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onCancel();
            } else if (e.key === 'Enter') {
                handleApply();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel, cropRect]);

    const handleApply = useCallback(() => {
        if (cropRect.width < 10 || cropRect.height < 10) {
            alert('Crop area is too small');
            return;
        }
        onApply(cropRect);
    }, [cropRect, onApply]);

    const handleMouseDown = useCallback((e, handle = null) => {
        e.stopPropagation();
        e.preventDefault();

        if (handle) {
            setIsResizing(true);
            setResizeHandle(handle);
        } else {
            setIsDragging(true);
        }
        setDragStart({ x: e.clientX, y: e.clientY });
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging && !isResizing) return;

        const dx = (e.clientX - dragStart.x) / (zoom / 100);
        const dy = (e.clientY - dragStart.y) / (zoom / 100);

        if (isDragging) {
            // Move crop area
            setCropRect(prev => {
                const newX = Math.max(0, Math.min(layer.width - prev.width, prev.x + dx));
                const newY = Math.max(0, Math.min(layer.height - prev.height, prev.y + dy));
                return { ...prev, x: newX, y: newY };
            });
        } else if (isResizing) {
            // Resize crop area
            setCropRect(prev => {
                let newRect = { ...prev };
                const minSize = 20;

                switch (resizeHandle) {
                    case 'top-left':
                        newRect.x = Math.max(0, prev.x + dx);
                        newRect.y = Math.max(0, prev.y + dy);
                        newRect.width = Math.max(minSize, prev.width - dx);
                        newRect.height = Math.max(minSize, prev.height - dy);
                        break;
                    case 'top-right':
                        newRect.y = Math.max(0, prev.y + dy);
                        newRect.width = Math.max(minSize, Math.min(layer.width - prev.x, prev.width + dx));
                        newRect.height = Math.max(minSize, prev.height - dy);
                        break;
                    case 'bottom-left':
                        newRect.x = Math.max(0, prev.x + dx);
                        newRect.width = Math.max(minSize, prev.width - dx);
                        newRect.height = Math.max(minSize, Math.min(layer.height - prev.y, prev.height + dy));
                        break;
                    case 'bottom-right':
                        newRect.width = Math.max(minSize, Math.min(layer.width - prev.x, prev.width + dx));
                        newRect.height = Math.max(minSize, Math.min(layer.height - prev.y, prev.height + dy));
                        break;
                    case 'top-center':
                        newRect.y = Math.max(0, prev.y + dy);
                        newRect.height = Math.max(minSize, prev.height - dy);
                        break;
                    case 'bottom-center':
                        newRect.height = Math.max(minSize, Math.min(layer.height - prev.y, prev.height + dy));
                        break;
                    case 'left-center':
                        newRect.x = Math.max(0, prev.x + dx);
                        newRect.width = Math.max(minSize, prev.width - dx);
                        break;
                    case 'right-center':
                        newRect.width = Math.max(minSize, Math.min(layer.width - prev.x, prev.width + dx));
                        break;
                }

                // Ensure crop stays within bounds
                if (newRect.x + newRect.width > layer.width) {
                    newRect.width = layer.width - newRect.x;
                }
                if (newRect.y + newRect.height > layer.height) {
                    newRect.height = layer.height - newRect.y;
                }

                return newRect;
            });
        }

        setDragStart({ x: e.clientX, y: e.clientY });
    }, [isDragging, isResizing, dragStart, resizeHandle, layer.width, layer.height, zoom]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeHandle(null);
    }, []);

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    const handleStyle = "absolute w-3 h-3 bg-white border-2 border-blue-600 z-[2002]";

    return (
        <div
            className="absolute z-[2000] pointer-events-auto"
            style={{
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                transform: `rotate(${layer.rotation || 0}deg)`,
                transformOrigin: 'center center',
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Dark overlay outside crop area */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top */}
                <div
                    className="absolute bg-black/50"
                    style={{
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: cropRect.y
                    }}
                />
                {/* Bottom */}
                <div
                    className="absolute bg-black/50"
                    style={{
                        left: 0,
                        top: cropRect.y + cropRect.height,
                        width: '100%',
                        height: layer.height - (cropRect.y + cropRect.height)
                    }}
                />
                {/* Left */}
                <div
                    className="absolute bg-black/50"
                    style={{
                        left: 0,
                        top: cropRect.y,
                        width: cropRect.x,
                        height: cropRect.height
                    }}
                />
                {/* Right */}
                <div
                    className="absolute bg-black/50"
                    style={{
                        left: cropRect.x + cropRect.width,
                        top: cropRect.y,
                        width: layer.width - (cropRect.x + cropRect.width),
                        height: cropRect.height
                    }}
                />
            </div>

            {/* Crop rectangle */}
            <div
                className="absolute border-2 border-white shadow-lg cursor-move"
                style={{
                    left: cropRect.x,
                    top: cropRect.y,
                    width: cropRect.width,
                    height: cropRect.height
                }}
                onMouseDown={(e) => handleMouseDown(e)}
            >
                {/* Corner handles */}
                <div
                    className={`${handleStyle} -left-1.5 -top-1.5 cursor-nwse-resize`}
                    onMouseDown={(e) => handleMouseDown(e, 'top-left')}
                />
                <div
                    className={`${handleStyle} -right-1.5 -top-1.5 cursor-nesw-resize`}
                    onMouseDown={(e) => handleMouseDown(e, 'top-right')}
                />
                <div
                    className={`${handleStyle} -left-1.5 -bottom-1.5 cursor-nesw-resize`}
                    onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
                />
                <div
                    className={`${handleStyle} -right-1.5 -bottom-1.5 cursor-nwse-resize`}
                    onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
                />

                {/* Edge handles */}
                <div
                    className={`${handleStyle} left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize`}
                    onMouseDown={(e) => handleMouseDown(e, 'top-center')}
                />
                <div
                    className={`${handleStyle} left-1/2 -bottom-1.5 -translate-x-1/2 cursor-ns-resize`}
                    onMouseDown={(e) => handleMouseDown(e, 'bottom-center')}
                />
                <div
                    className={`${handleStyle} -left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize`}
                    onMouseDown={(e) => handleMouseDown(e, 'left-center')}
                />
                <div
                    className={`${handleStyle} -right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize`}
                    onMouseDown={(e) => handleMouseDown(e, 'right-center')}
                />
            </div>

            {/* Action buttons - Fixed at bottom of layer */}
            <div
                className="absolute flex gap-2 z-[2003] pointer-events-auto"
                style={{
                    left: '50%',
                    bottom: -60,
                    transform: 'translateX(-50%)'
                }}
            >
                <button
                    onClick={handleApply}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-medium"
                >
                    <FiCheck size={18} />
                    Apply
                </button>
                <button
                    onClick={onCancel}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-medium"
                >
                    <FiX size={18} />
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default CropOverlay;
