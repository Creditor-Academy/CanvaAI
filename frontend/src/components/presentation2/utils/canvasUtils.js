/**
 * Canvas Utility Functions
 * 
 * Pure functions for canvas calculations and transformations.
 * No React dependencies - can be used anywhere.
 */

/**
 * Converts screen coordinates to canvas coordinates
 * @param {number} screenX - Screen X coordinate
 * @param {number} screenY - Screen Y coordinate
 * @param {Object} transform - Transform object { zoom, pan: { x, y } }
 * @returns {Object} { x, y } - Canvas coordinates
 */
export const screenToCanvas = (screenX, screenY, transform) => {
  const { zoom, pan } = transform;
  return {
    x: (screenX - pan.x) / zoom,
    y: (screenY - pan.y) / zoom,
  };
};

/**
 * Converts canvas coordinates to screen coordinates
 * @param {number} canvasX - Canvas X coordinate
 * @param {number} canvasY - Canvas Y coordinate
 * @param {Object} transform - Transform object { zoom, pan: { x, y } }
 * @returns {Object} { x, y } - Screen coordinates
 */
export const canvasToScreen = (canvasX, canvasY, transform) => {
  const { zoom, pan } = transform;
  return {
    x: canvasX * zoom + pan.x,
    y: canvasY * zoom + pan.y,
  };
};

/**
 * Checks if a point is inside a rectangle
 * @param {number} x - Point X
 * @param {number} y - Point Y
 * @param {Object} rect - Rectangle { x, y, width, height }
 * @returns {boolean}
 */
export const pointInRect = (x, y, rect) => {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
};

/**
 * Calculates distance between two points
 * @param {Object} p1 - Point 1 { x, y }
 * @param {Object} p2 - Point 2 { x, y }
 * @returns {number}
 */
export const distance = (p1, p2) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Snaps a value to the nearest grid point
 * @param {number} value - Value to snap
 * @param {number} gridSize - Grid size
 * @returns {number}
 */
export const snapToGrid = (value, gridSize = 10) => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Constrains a value between min and max
 * @param {number} value - Value to constrain
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number}
 */
export const constrain = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Calculates bounding box for multiple layers
 * @param {Array} layers - Array of layer objects
 * @returns {Object} { x, y, width, height } or null if no layers
 */
export const getBoundingBox = (layers) => {
  if (!layers || layers.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  layers.forEach((layer) => {
    minX = Math.min(minX, layer.x);
    minY = Math.min(minY, layer.y);
    maxX = Math.max(maxX, layer.x + layer.width);
    maxY = Math.max(maxY, layer.y + layer.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};
