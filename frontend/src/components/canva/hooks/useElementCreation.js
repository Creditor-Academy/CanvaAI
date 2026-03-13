import { useCallback } from 'react';
import { initialTextSettings, initialShapeSettings } from '../state/initialState';

export const useElementCreation = (
  layers,
  setLayers,
  setSelectedLayer,
  canvasSize,
  textSettings,
  shapeSettings,
  saveToHistory
) => {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const handleAddElement = useCallback((x = 100, y = 100, toolOverride = null, selectedTool = 'select') => {
    let newLayer;
    const tool = toolOverride || selectedTool;

    if (tool === 'text' || tool === 'heading' || tool === 'subheading' || tool === 'textbox') {
      const isHeading = tool === 'heading';
      const isSubheading = tool === 'subheading';

      const presetName =
        tool === 'heading'
          ? 'Heading'
          : tool === 'subheading'
            ? 'Subheading'
            : 'Body Text';

      const presetText =
        tool === 'heading'
          ? 'Add a heading'
          : tool === 'subheading'
            ? 'Add a subheading'
            : 'Add some body text';

      const presetFontSize =
        tool === 'heading'
          ? 32
          : tool === 'subheading'
            ? 24
            : 16;

      const presetFontWeight = isHeading ? '700' : isSubheading ? '600' : '400';

      const width = 300;
      const height = isHeading ? 80 : isSubheading ? 60 : 50;

      newLayer = {
        id: Date.now(),
        type: 'text',
        name: presetName,
        text: presetText,
        x: x,
        y: y,
        width,
        height,
        ...textSettings,
        fontSize: presetFontSize,
        fontWeight: presetFontWeight,
        visible: true,
        locked: false,
        rotation: 0,
      };
    } else if (
      ['rectangle', 'roundedRectangle', 'circle', 'ellipse', 'triangle', 'rightTriangle',
        'diamond', 'pentagon', 'hexagon', 'star', 'star6', 'heart', 'arrow', 'arrowLeft',
        'arrowUp', 'arrowDown', 'cloud', 'line'].includes(tool)
    ) {
      const width =
        tool === 'ellipse' || tool === 'roundedRectangle' ? 160
          : tool.includes('arrow') ? 140
            : tool === 'line' ? 300
              : 100;
      const height =
        tool === 'ellipse' || tool === 'roundedRectangle' ? 100
          : tool === 'line' ? 4
            : 100;

      const safeX = clamp(x, 0, canvasSize.width - width);
      const safeY = clamp(y, 0, canvasSize.height - height);

      newLayer = {
        id: Date.now(),
        type: 'shape',
        name: tool.charAt(0).toUpperCase() + tool.slice(1),
        shape: tool,
        x: safeX,
        y: safeY,
        width,
        height,
        ...shapeSettings,
        visible: true,
        locked: false,
        rotation: 0,
      };
    }

    if (newLayer) {
      const newLayers = [...layers, newLayer];
      setLayers(newLayers);
      setSelectedLayer(newLayer.id);
      saveToHistory(newLayers);
    }
  }, [layers, canvasSize, textSettings, shapeSettings, setLayers, setSelectedLayer, saveToHistory]);

  return { handleAddElement };
};
