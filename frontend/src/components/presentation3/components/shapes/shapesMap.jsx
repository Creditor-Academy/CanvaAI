import ArrowPath from "./ArrowPath";

export const shapesMap = {
  // Rectangle
  rect: ({ fill, stroke, strokeWidth }) => (
    <rect x="0" y="0" width="100" height="100" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  ),

  // Rounded Rectangle
  roundedRect: ({ fill, stroke, strokeWidth }) => (
    <rect x="0" y="0" width="100" height="100" rx="12" ry="12" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  ),

  // Circle / Ellipse
  circle: ({ fill, stroke, strokeWidth }) => (
    <ellipse cx="50" cy="50" rx="49" ry="49" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  ),

  // Triangle
  triangle: ({ fill, stroke, strokeWidth }) => (
    <polygon points="50,0 100,100 0,100" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  ),

  // Diamond
  diamond: ({ fill, stroke, strokeWidth }) => (
    <polygon points="50,0 100,50 50,100 0,50" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  ),

  // Line
  line: ({ stroke, strokeWidth }) => (
    <line x1="0" y1="50" x2="100" y2="50" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
  ),

  // Block Arrows
  arrowRight: ({ fill, stroke, strokeWidth }) => (
    <path d="M0 30 L60 30 L60 10 L100 50 L60 90 L60 70 L0 70 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  ),

  arrowLeft: ({ fill, stroke, strokeWidth }) => (
    <path d="M100 30 L40 30 L40 10 L0 50 L40 90 L40 70 L100 70 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  ),

  arrowUp: ({ fill, stroke, strokeWidth }) => (
    <path d="M30 100 L30 40 L10 40 L50 0 L90 40 L70 40 L70 100 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  ),

  arrowDown: ({ fill, stroke, strokeWidth }) => (
    <path d="M30 0 L30 60 L10 60 L50 100 L90 60 L70 60 L70 0 Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  ),

  // Standard Line Arrow
  arrow: ArrowPath,
};
