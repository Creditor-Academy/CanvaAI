import React, { useRef, forwardRef } from 'react';
import { Group, Rect, Circle, Line } from 'react-konva';

/**
 * ShapeLayer Component
 * 
 * Renders a shape layer on the canvas with:
 * - Different shape types (rectangle, circle, triangle, line)
 * - Fill and stroke colors
 * - Drag functionality
 * - Selection highlighting
 */
const ShapeLayer = forwardRef(({
  layer,
  isSelected,
  onDragStart,
  onDragMove,
  onDragEnd,
  onClick,
  scale = 1,
}, ref) => {
  const {
    x,
    y,
    width,
    height,
    rotation = 0,
    style = {},
  } = layer;

  const {
    shape = 'rectangle',
    fill = '#3b82f6',
    stroke = 'transparent',
    strokeWidth = 0,
  } = style;

  // Calculate scaled dimensions
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const scaledStrokeWidth = strokeWidth * scale;

  const renderShape = () => {
    switch (shape) {
      case 'circle':
        const radius = Math.min(scaledWidth, scaledHeight) / 2;
        return (
          <Circle
            x={scaledWidth / 2}
            y={scaledHeight / 2}
            radius={radius}
            fill={fill}
            stroke={isSelected ? '#3b82f6' : stroke}
            strokeWidth={isSelected ? 2 / scale : scaledStrokeWidth}
          />
        );
      
      case 'triangle':
        const points = [
          scaledWidth / 2, 0, // Top
          scaledWidth, scaledHeight, // Bottom right
          0, scaledHeight, // Bottom left
        ];
        return (
          <Line
            points={points}
            closed
            fill={fill}
            stroke={isSelected ? '#3b82f6' : stroke}
            strokeWidth={isSelected ? 2 / scale : scaledStrokeWidth}
          />
        );
      
      case 'line':
        return (
          <Line
            points={[0, scaledHeight / 2, scaledWidth, scaledHeight / 2]}
            stroke={fill}
            strokeWidth={scaledStrokeWidth || 2 * scale}
            lineCap="round"
          />
        );
      
      case 'rectangle':
      default:
        return (
          <Rect
            x={0}
            y={0}
            width={scaledWidth}
            height={scaledHeight}
            fill={fill}
            stroke={isSelected ? '#3b82f6' : stroke}
            strokeWidth={isSelected ? 2 / scale : scaledStrokeWidth}
            cornerRadius={0}
          />
        );
    }
  };

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
      
      {/* Shape */}
      {renderShape()}
    </Group>
  );
});

ShapeLayer.displayName = 'ShapeLayer';

export default ShapeLayer;
