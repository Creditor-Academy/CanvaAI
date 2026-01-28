import { shapesMap } from "./shapesMap";

const ShapeRenderer = ({ layer }) => {
  const Shape = shapesMap[layer.shapeType];
  if (!Shape) return null;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ overflow: "visible" }}
    >
      <Shape
        fill={layer.fill}
        stroke={layer.stroke}
        strokeWidth={layer.strokeWidth}
      />
    </svg>
  );
};

export default ShapeRenderer;
