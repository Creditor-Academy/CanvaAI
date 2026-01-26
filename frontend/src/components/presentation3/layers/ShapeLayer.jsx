import ShapeRenderer from "../components/shapes/ShapeRenderer";

const ShapeLayer = ({ layer, selected, onMouseDown }) => {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        border: selected ? "2px solid #2563eb" : "none",
        cursor: "move",
      }}
    >
      <ShapeRenderer layer={layer} />
    </div>
  );
};

export default ShapeLayer;