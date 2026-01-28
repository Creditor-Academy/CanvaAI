import ShapeRenderer from "../components/shapes/ShapeRenderer";

const ShapeLayer = ({ layer, selected, onMouseDown, children }) => {
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
        transform: `rotate(${layer.rotation || 0}deg)`,
        transformOrigin: "center",
      }}
    >
      <ShapeRenderer layer={layer} />
      {children}
    </div>
  );
};

export default ShapeLayer;