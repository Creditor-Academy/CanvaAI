import ArrowPath from "./ArrowPath";

export const shapesMap = {
  rect: ({ fill }) => (
    <rect width="100%" height="100%" fill={fill}/>
  ),

  roundedRect: ({ fill }) => (
    <rect rx="12" ry="12" width="100%" height="100%" fill={fill} />
  ),

  circle: ({ fill }) => (
    <ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill={fill} />
  ),

  diamond: ({ fill }) => (
    <polygon
      points="50,0 100,50 50,100 0,50"
      fill={fill}
    />
  ),

  line: ({ stroke, strokeWidth }) => (
    <line
      x1="0"
      y1="50%"
      x2="100%"
      y2="50%"
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  ),

  arrow: ArrowPath,
};
