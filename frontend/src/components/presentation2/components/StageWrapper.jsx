import React from 'react';
import { Stage, Layer, Rect } from 'react-konva';

/**
 * StageWrapper Component
 *
 * A simplified and robust React-Konva Stage wrapper.
 * It creates a background layer and a content layer where all
 * dynamic elements (shapes, text, transformers) will be rendered.
 */
const StageWrapper = ({
  width,
  height,
  zoom,
  background,
  onStageClick,
  selectedTool = 'select',
  renderLayers, // Function to render layers
  children, // All dynamic content will be passed as children
}) => {
  // Calculate scaled dimensions for the stage
  const scaledWidth = width * zoom;
  const scaledHeight = height * zoom;

  // Determine cursor style based on the currently selected tool
  const cursorStyle = selectedTool === 'text' ? 'text' :
                      selectedTool === 'shape' ? 'crosshair' :
                      'default';

  return (
    <Stage
      width={scaledWidth}
      height={scaledHeight}
      onClick={onStageClick}
      onTap={onStageClick}
      style={{ cursor: cursorStyle }}
    >
      {/* Background Layer: A simple rectangle for the slide background */}
      <Layer>
        <Rect
          x={0}
          y={0}
          width={scaledWidth}
          height={scaledHeight}
          fill={background || '#ffffff'}
          name="background"
        />
      </Layer>

      {/* Content Layer: Renders dynamically created layers or children */}
      <Layer>
        {renderLayers ? renderLayers() : children}
      </Layer>
    </Stage>
  );
};

export default StageWrapper;
