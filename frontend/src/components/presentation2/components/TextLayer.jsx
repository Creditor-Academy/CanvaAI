import React, { useRef, forwardRef } from 'react';
import { Group, Text as KonvaText, Rect } from 'react-konva';

/**
 * TextLayer Component
 * 
 * Renders a text layer on the canvas with:
 * - Editable text content
 * - Drag functionality
 * - Selection highlighting
 * - Text styling
 */
const TextLayer = forwardRef(({
  layer,
  isSelected,
  onDragStart,
  onDragMove,
  onDragEnd,
  onClick,
  onDoubleClick,
  scale = 1,
}, ref) => {
  const textRef = useRef(null);

  const {
    x,
    y,
    width,
    height,
    rotation = 0,
    style = {},
  } = layer;

  const {
    text = 'Text',
    fontSize = 24,
    fontFamily = 'Arial',
    color = '#000000',
    textAlign = 'left',
    fontWeight = 'normal',
    fontStyle = 'normal',
    backgroundColor = 'transparent',
  } = style;

  // Calculate scaled dimensions
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const scaledFontSize = fontSize * scale;

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
      onDblClick={(e) => {
        e.cancelBubble = true;
        onDoubleClick?.(e);
      }}
      onDblTap={(e) => {
        e.cancelBubble = true;
        onDoubleClick?.(e);
      }}
    >
      {/* Background (for selection highlight or background color) */}
      {(isSelected || backgroundColor !== 'transparent') && (
        <Rect
          x={0}
          y={0}
          width={scaledWidth}
          height={scaledHeight}
          fill={isSelected ? 'rgba(59, 130, 246, 0.1)' : backgroundColor}
          stroke={isSelected ? '#3b82f6' : 'transparent'}
          strokeWidth={isSelected ? 2 / scale : 0}
          dash={isSelected ? [5 / scale, 5 / scale] : []}
        />
      )}

      {/* Text */}
      <KonvaText
        ref={textRef}
        x={0}
        y={0}
        width={scaledWidth}
        height={scaledHeight}
        text={text}
        fontSize={scaledFontSize}
        fontFamily={fontFamily}
        fontStyle={fontStyle}
        fill={color}
        align={textAlign}
        verticalAlign="middle"
        padding={8 * scale}
        wrap="word"
        listening={true}
      />
    </Group>
  );
});

TextLayer.displayName = 'TextLayer';

export default TextLayer;
