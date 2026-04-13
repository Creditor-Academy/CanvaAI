import { calculateTextDimensions, isHeadingLayer } from '../../../utils/textUtils';
import { enhanceText } from '../TextEnhanceService';
import { toast } from 'sonner';

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
      // Try to extract an API error message from different possible error shapes
      let apiMessage = null;
      try {
        if (error && typeof error.json === 'function') {
          const parsed = await error.json();
          apiMessage = parsed?.error || parsed?.message || (typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
        } else if (error?.response) {
          const resp = error.response;
          if (resp.data) apiMessage = resp.data.error || resp.data.message || JSON.stringify(resp.data);
          else if (typeof resp.json === 'function') {
            const parsed = await resp.json();
            apiMessage = parsed?.error || parsed?.message || JSON.stringify(parsed);
          }
        } else if (error?.message) {
          apiMessage = error.message;
        }
      } catch (parseErr) {
        console.error('Failed to parse error response', parseErr);
      }

      const toastMsg = apiMessage ? `Error enhancing text: ${apiMessage}` : 'Error enhancing text: ' + (error?.message || 'Unknown error');
      toast.error(toastMsg);

    } finally {
      setIsEnhancingText(false);
    }
  };
};
