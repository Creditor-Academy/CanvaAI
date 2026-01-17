import React from 'react';
import { Stage, Layer, Rect } from 'react-konva';

/**
 * StageWrapper Component
 * 
 * React-konva Stage wrapper that handles:
 * - Stage rendering
 * - Layer management
 * - Selection
 * - Transform handles
 * 
 * This is where all canvas rendering logic lives.
 */
const StageWrapper = ({
  width,
  height,
  zoom,
  background,
  layers = [],
  selectedIds = [],
  onStageClick,
  onLayerClick,
  onLayerDragEnd,
  onLayerTransformEnd,
  renderLayers,
}) => {
  // Calculate scaled dimensions
  const scaledWidth = width * zoom;
  const scaledHeight = height * zoom;

  return (
    <Stage
      width={scaledWidth}
      height={scaledHeight}
      onClick={onStageClick}
      onTap={onStageClick}
      style={{ cursor: 'default' }}
    >
      {/* Background Layer */}
      <Layer>
        <Rect
          x={0}
          y={0}
          width={scaledWidth}
          height={scaledHeight}
          fill={background || '#ffffff'}
        />
      </Layer>

      {/* Content Layer */}
      <Layer>
        {/* TODO: Render layers here */}
        {/* This will be handled by renderLayers prop or direct layer rendering */}
        {renderLayers ? renderLayers() : null}
      </Layer>

      {/* Selection/Transform Layer */}
      <Layer>
        {/* TODO: Render selection handles and transform controls */}
        {/* TODO: Render alignment guides */}
      </Layer>
    </Stage>
  );
};

export default StageWrapper;
