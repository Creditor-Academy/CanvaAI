import React from "react";
import { useDragLayer } from "react-dnd";
import SlideThumbnail from "./SlideThumbnail";

const layerStyles = {
  position: "fixed",
  pointerEvents: "none",
  zIndex: 9999,
  left: 0,
  top: 0,
  width: "100%",
  height: "100%",
};

function getItemStyles(currentOffset) {
  if (!currentOffset) {
    return {
      display: "none",
    };
  }

  let { x, y } = currentOffset;

  const transform = `translate(${x}px, ${y}px) scale(1.05)`;
  return {
    transform,
    WebkitTransform: transform,
    boxShadow: "0 12px 24px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.1)",
    borderRadius: "10px",
    background: "#ffffff",
    padding: "6px",
    border: "1px solid #e2e8f0",
    width: "114px", // 100px thumbnail + padding
  };
}

const CustomDragLayer = () => {
  const { itemType, isDragging, item, currentOffset } =
    useDragLayer((monitor) => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
    }));

  if (!isDragging || itemType !== "slide" || !item?.slide) {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(currentOffset)}>
        <div style={{ width: "100px", height: "56.25px", overflow: "hidden", borderRadius: "6px" }}>
          <SlideThumbnail slide={item.slide} isActive={true} onClick={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default CustomDragLayer;
