import { calculateTextDimensions, isHeadingLayer } from '../../../utils/textUtils';
import { enhanceText } from '../TextEnhanceService';

/**
 * Text content change handler
 */
export const createTextContentHandler = (
  selectedLayer,
  layers,
  setLayers,
  saveToHistory,
  shouldAutoResize = true
) => {
  return (value) => {
    if (!selectedLayer) return;

    const layer = layers.find(l => l.id === selectedLayer && l.type === 'text');
    if (!layer) return;

    let updatedLayer = { ...layer, text: value };

    if (shouldAutoResize) {
      const dimensions = calculateTextDimensions(value, layer);
      updatedLayer = {
        ...updatedLayer,
        width: dimensions.width,
        height: dimensions.height
      };
    }

    const newLayers = layers.map(l =>
      l.id === selectedLayer && l.type === 'text' ? updatedLayer : l
    );
    setLayers(newLayers);
    saveToHistory(newLayers);
  };
};

/**
 * Text settings change handler
 */
export const createTextSettingsHandler = (
  selectedLayer,
  layers,
  setLayers,
  saveToHistory
) => {
  return (property, value) => {
    if (selectedLayer) {
      const newLayers = layers.map(l =>
        l.id === selectedLayer ? { ...l, [property]: value } : l
      );
      setLayers(newLayers);
      saveToHistory(newLayers);
    }
  };
};

/**
 * AI Text enhancement handler
 */
export const createEnhanceTextHandler = (
  selectedLayer,
  layers,
  isHeading,
  handleTextContentChange,
  setIsEnhancingText
) => {
  return async () => {
    if (!selectedLayer) return;

    const selectedTextLayer = layers.find(l => l.id === selectedLayer && l.type === 'text');
    if (!selectedTextLayer || !selectedTextLayer.text || !selectedTextLayer.text.trim()) {
      alert('Please enter some text to enhance');
      return;
    }

    const detectedIsHeading = isHeading || isHeadingLayer(selectedTextLayer);
    setIsEnhancingText(true);

    try {
      const data = await enhanceText(selectedTextLayer.text, detectedIsHeading);
      handleTextContentChange(data.enhancedText, true);
    } catch (error) {
      console.error('Error enhancing text:', error);
      alert('Error enhancing text: ' + error.message);
    } finally {
      setIsEnhancingText(false);
    }
  };
};
