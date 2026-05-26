// layout/layoutValidator.js

export function validateLayout(slide) {
  if (!slide?.layers) return slide;

  const safeLayers = slide.layers.map((layer) => {
    let { x, y, width, height } = layer;

    // Prevent NaN issues
    x = isNaN(Number(x)) ? 0 : x;
    y = isNaN(Number(y)) ? 0 : y;

    // Clamp sizes
    width = Math.max(50, Number(width) || 100);
    height = Math.max(30, Number(height) || 50);

    return {
      ...layer,
      x,
      y,
      width,
      height,
    };
  });

  return {
    ...slide,
    layers: safeLayers,
  };
}