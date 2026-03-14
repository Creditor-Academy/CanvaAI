import ArrowPath from "./ArrowPath";

export const shapesMap = {
  // Rectangle
  rect: ({ fillColor, strokeColor, strokeWidth }) => (
    <rect x="0" y="0" width="100" height="100" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
  ),

  // Rounded Rectangle
  roundedRect: ({ fillColor, strokeColor, strokeWidth }) => (
    <rect x="0" y="0" width="100" height="100" rx="12" ry="12" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
  ),

  // Circle / Ellipse
  circle: ({ fillColor, strokeColor, strokeWidth }) => (
    <ellipse cx="50" cy="50" rx="49" ry="49" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
  ),

  // Triangle
  triangle: ({ fillColor, strokeColor, strokeWidth }) => (
    <polygon points="50,0 100,100 0,100" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
  ),

  // Diamond
  diamond: ({ fillColor, strokeColor, strokeWidth }) => (
    <polygon points="50,0 100,50 50,100 0,50" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
  ),

  // Line
  line: ({ strokeColor, strokeWidth }) => (
    <line x1="0" y1="50" x2="100" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
  ),

  // Block Arrows
  arrowRight: ({ fillColor, strokeColor, strokeWidth }) => (
    <path d="M0 30 L60 30 L60 10 L100 50 L60 90 L60 70 L0 70 Z" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
  ),

  arrowLeft: ({ fillColor, strokeColor, strokeWidth }) => (
    <path d="M100 30 L40 30 L40 10 L0 50 L40 90 L40 70 L100 70 Z" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
  ),

  arrowUp: ({ fillColor, strokeColor, strokeWidth }) => (
    <path d="M30 100 L30 40 L10 40 L50 0 L90 40 L70 40 L70 100 Z" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
  ),

  arrowDown: ({ fillColor, strokeColor, strokeWidth }) => (
    <path d="M30 0 L30 60 L10 60 L50 100 L90 60 L70 60 L70 0 Z" fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} />
  ),

  // Standard Line Arrow
  arrow: ArrowPath,
};
