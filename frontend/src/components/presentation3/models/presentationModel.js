export const createShapeLayer = (shapeType) => ({
  id: crypto.randomUUID(),
  type: "shape",

  // shape identity
  shapeType, // "rect" | "circle" | "line" | "arrow"

  // positioning
  x: 200,
  y: 200,

  // size defaults
  width: shapeType === "line" || shapeType === "arrow" ? 400 : 120, // Bigger default size
  height: shapeType === "line" || shapeType === "arrow" ? 40 : 80, // Increased hit area

  // style
  fillColor: (shapeType === "line" || shapeType === "arrow") ? "transparent" : "#ffffff",
  strokeColor: "#1e40af",
  strokeWidth: (shapeType === "line" || shapeType === "arrow") ? 8 : 1, // Thicker default for line/arrow, 1 otherwise

  // transforms
  rotation: 0,

  // misc (useful later)
  opacity: 1,
  locked: false,
});

export const createImageLayer = (src, imageUrl, imageKey) => ({
  id: crypto.randomUUID(),
  type: "image",
  src, // Keep for backward compatibility or direct URL addition
  imageUrl,
  imageKey,
  x: 200,
  y: 150,
  width: 240,
  height: 160,
  rotation: 0,
  borderRadius: 0,
  borderWidth: 0,
  borderColor: "#000000",
});