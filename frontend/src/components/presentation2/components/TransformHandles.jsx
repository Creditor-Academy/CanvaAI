import React, { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';

/**
 * TransformHandles Component
 * 
 * Provides resize and rotate handles for selected layers.
 * Uses Konva Transformer for resize handles.
 */
const TransformHandles = ({
  targetRef,
  isVisible,
  scale = 1,
  onTransformEnd,
  layer,
}) => {
  const transformerRef = useRef(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (isVisible && targetRef?.current) {
      const node = targetRef.current;
      
      // Reset scale to prevent accumulation
      node.scaleX(1);
      node.scaleY(1);
      
      // Attach transformer
      transformer.nodes([node]);
      transformer.forceUpdate();
    } else {
      transformer.nodes([]);
    }
    
    transformer.getLayer()?.batchDraw();
  }, [isVisible, targetRef, layer?.x, layer?.y, layer?.width, layer?.height, layer?.rotation]);

  if (!isVisible) {
    return null;
  }

  return (
    <Transformer
      ref={transformerRef}
      boundBoxFunc={(oldBox, newBox) => {
        // Minimum size constraint
        const minSize = 24 / scale;
        if (Math.abs(newBox.width) < minSize || Math.abs(newBox.height) < minSize) {
          return oldBox;
        }
        return newBox;
      }}
      onTransformEnd={() => {
        const transformer = transformerRef.current;
        if (!transformer || !targetRef?.current) return;

        const node = targetRef.current;
        
        // Get the new dimensions and position
        const newAttrs = {
          x: node.x() / scale,
          y: node.y() / scale,
          width: node.width() * node.scaleX() / scale,
          height: node.height() * node.scaleY() / scale,
          rotation: node.rotation(),
        };

        // Reset scale
        node.scaleX(1);
        node.scaleY(1);

        onTransformEnd?.(newAttrs);
      }}
      rotateEnabled={!layer?.locked}
      enabledAnchors={layer?.locked ? [] : [
        'top-left',
        'top-center',
        'top-right',
        'middle-left',
        'middle-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ]}
      borderEnabled={true}
      borderStroke="#3b82f6"
      borderStrokeWidth={2 / scale}
      anchorFill="#ffffff"
      anchorStroke="#3b82f6"
      anchorStrokeWidth={2 / scale}
      anchorSize={8 / scale}
      keepRatio={false}
    />
  );
};

export default TransformHandles;
