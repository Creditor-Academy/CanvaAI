import React, { useRef, useState, useEffect, forwardRef } from 'react';
import { Group, Image as KonvaImage, Rect } from 'react-konva';

/**
 * ImageLayer Component
 * 
 * Renders an image layer on the canvas with:
 * - Image loading and display
 * - Drag functionality
 * - Selection highlighting
 */
const ImageLayer = forwardRef(({
  layer,
  isSelected,
  onDragStart,
  onDragMove,
  onDragEnd,
  onClick,
  scale = 1,
}, ref) => {
  const [image, setImage] = useState(null);
  const imageRef = useRef(null);

  const {
    x,
    y,
    width,
    height,
    rotation = 0,
    style = {},
  } = layer;

  const { src = '' } = style;

  // Calculate scaled dimensions
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  // Load image
  useEffect(() => {
    if (!src) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
    };
    img.onerror = () => {
      console.error('Failed to load image:', src);
    };
    img.src = src;
  }, [src]);

  return (
    <Group
      ref={ref}
      x={x * scale}
      y={y * scale}
      width={scaledWidth}
      height={scaledHeight}
      rotation={rotation}
      draggable={!layer.locked}
      onDragStart={(e) => {
        e.cancelBubble = true;
        onDragStart?.(e);
      }}
      onDragMove={(e) => {
        onDragMove?.(e);
      }}
      onDragEnd={(e) => {
        onDragEnd?.(e);
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        onClick?.(e);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onClick?.(e);
      }}
    >
      {/* Selection highlight background */}
      {isSelected && (
        <Rect
          x={-2 / scale}
          y={-2 / scale}
          width={scaledWidth + 4 / scale}
          height={scaledHeight + 4 / scale}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="#3b82f6"
          strokeWidth={2 / scale}
          dash={[5 / scale, 5 / scale]}
        />
      )}
      
      {/* Image */}
      {image && (
        <KonvaImage
          ref={imageRef}
          image={image}
          x={0}
          y={0}
          width={scaledWidth}
          height={scaledHeight}
        />
      )}
      
      {/* Placeholder if image not loaded */}
      {!image && (
        <Rect
          x={0}
          y={0}
          width={scaledWidth}
          height={scaledHeight}
          fill="#e5e7eb"
          stroke="#d1d5db"
          strokeWidth={1 / scale}
        />
      )}
    </Group>
  );
});

ImageLayer.displayName = 'ImageLayer';

export default ImageLayer;
