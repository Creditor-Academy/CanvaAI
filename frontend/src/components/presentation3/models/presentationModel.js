export const createShapeLayer = (shapeType) => ({
  id: crypto.randomUUID(),
  type: "shape",

  // shape identity
  shapeType, // "rect" | "circle" | "line" | "arrow"

  // positioning
  x: 200,
  y: 200,

  // size defaults
  width: shapeType === "line" || shapeType === "arrow" ? 200 : 120,
  height: shapeType === "line" || shapeType === "arrow" ? 20 : 80, // Increased hit area

  // style
  fill: shapeType === "line" || shapeType === "arrow" ? "transparent" : "#3b82f6",
  stroke: "#1e40af",
  strokeWidth: shapeType === "line" || shapeType === "arrow" ? 4 : 2, // Thicker default

  // transforms
  rotation: 0,

  // misc (useful later)
  opacity: 1,
  locked: false,
});

export const createImageLayer = (src) => ({
  id: crypto.randomUUID(),
  type: "image",
  src,
  x: 200,
  y: 150,
  width: 240,
  height: 160,
  rotation: 0,
});