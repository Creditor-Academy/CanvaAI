/**
 * Presentation Data Model
 * 
 * This file defines the core data structures for presentations.
 * All presentation data follows this model as the single source of truth.
 */

/**
 * @typedef {Object} Layer
 * @property {string} id - Unique identifier
 * @property {string} type - 'text' | 'image' | 'shape'
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} width - Width in pixels
 * @property {number} height - Height in pixels
 * @property {number} rotation - Rotation in degrees (0-360)
 * @property {boolean} visible - Whether layer is visible
 * @property {boolean} locked - Whether layer is locked from editing
 * @property {Object} style - Style properties (varies by type)
 */

/**
 * @typedef {Object} Slide
 * @property {string} id - Unique identifier
 * @property {string} name - Slide name/title
 * @property {string} background - Background color (hex)
 * @property {Layer[]} layers - Array of layers on this slide
 */

/**
 * @typedef {Object} Presentation
 * @property {string} id - Unique identifier
 * @property {string} title - Presentation title
 * @property {Slide[]} slides - Array of slides
 * @property {Object} settings - Presentation settings
 * @property {number} settings.width - Canvas width (default: 960)
 * @property {number} settings.height - Canvas height (default: 540)
 */

/**
 * Creates a new empty presentation
 * @returns {Presentation}
 */
export const createEmptyPresentation = () => {
  const defaultWidth = 960;
  const defaultHeight = 540;
  
  return {
    id: `presentation-${Date.now()}`,
    title: 'Untitled Presentation',
    slides: [createEmptySlide({ width: defaultWidth, height: defaultHeight })],
    settings: {
      width: defaultWidth,
      height: defaultHeight,
    },
  };
};

/**
 * Creates a new empty slide with default title and body text boxes (like Google Slides)
 * @param {Object} options - Options for creating the slide
 * @param {number} options.width - Canvas width (default: 960)
 * @param {number} options.height - Canvas height (default: 540)
 * @returns {Slide}
 */
export const createEmptySlide = (options = {}) => {
  const canvasWidth = options.width || 960;
  const canvasHeight = options.height || 540;
  
  // Create default title box (positioned at top center)
  const titleBox = createLayer('text', {
    x: (canvasWidth / 2) - 200, // Center horizontally
    y: 60, // Top area
    width: 400,
    height: 60,
    text: 'Title',
    fontSize: 36,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  });
  
  // Create default body text box (positioned below title)
  const bodyBox = createLayer('text', {
    x: (canvasWidth / 2) - 250, // Center horizontally
    y: 150, // Below title
    width: 500,
    height: 300,
    text: 'Body text',
    fontSize: 18,
    fontFamily: 'Arial',
    color: '#000000',
    textAlign: 'left',
  });
  
  return {
    id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Slide 1',
    background: '#ffffff',
    layers: [titleBox, bodyBox],
  };
};

/**
 * Creates a new layer
 * @param {string} type - Layer type
 * @param {Object} props - Layer properties
 * @returns {Layer}
 */
export const createLayer = (type, props = {}) => {
  const baseLayer = {
    id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    x: props.x || 0,
    y: props.y || 0,
    width: props.width || 100,
    height: props.height || 100,
    rotation: props.rotation || 0,
    visible: props.visible !== undefined ? props.visible : true,
    locked: props.locked || false,
    style: props.style || {},
  };

  // Type-specific defaults
  if (type === 'text') {
    baseLayer.style = {
      text: props.text || 'Text',
      fontSize: props.fontSize || 24,
      fontFamily: props.fontFamily || 'Arial',
      color: props.color || '#000000',
      textAlign: props.textAlign || 'left',
      ...baseLayer.style,
    };
  } else if (type === 'image') {
    baseLayer.style = {
      src: props.src || '',
      ...baseLayer.style,
    };
  } else if (type === 'shape') {
    baseLayer.style = {
      shape: props.shape || 'rectangle', // 'rectangle' | 'circle' | 'triangle'
      fill: props.fill || '#3b82f6',
      stroke: props.stroke || 'transparent',
      strokeWidth: props.strokeWidth || 0,
      ...baseLayer.style,
    };
  }

  return baseLayer;
};

/**
 * Validates a presentation object
 * @param {Presentation} presentation
 * @returns {boolean}
 */
export const validatePresentation = (presentation) => {
  if (!presentation || !presentation.id || !presentation.slides) {
    return false;
  }
  if (!Array.isArray(presentation.slides) || presentation.slides.length === 0) {
    return false;
  }
  return true;
};