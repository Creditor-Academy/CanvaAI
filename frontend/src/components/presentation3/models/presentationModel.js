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
  height: shapeType === "line" || shapeType === "arrow" ? 2 : 80,

  // style
  fill: shapeType === "line" || shapeType === "arrow" ? "transparent" : "#3b82f6",
  stroke: "#1e40af",
  strokeWidth: 2,

  // transforms
  rotation: 0,

  // misc (useful later)
  opacity: 1,
  locked: false,
});