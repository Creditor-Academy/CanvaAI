import React from "react";
import usePresentationStore from "../store/usePresentationStore";

const TextLayer = ({ layer }) => {
  const {
    selectedLayerId,
    setSelectedLayer,
    updateLayerPosition,
  } = usePresentationStore();

  const isSelected = selectedLayerId === layer.id;

  return (
    <div
      style={{
        position: "absolute",
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        padding: 6,
        border: isSelected
          ? "1.5px solid #2563eb"
          : "1px solid transparent",
        cursor: "move",
        boxSizing: "border-box",
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        setSelectedLayer(layer.id);
      }}
    >
      <div
        contentEditable
        suppressContentEditableWarning
        style={{
          width: "100%",
          height: "100%",
          fontSize: layer.fontSize,
          color: layer.color,
          fontFamily: layer.fontFamily,
          fontWeight: layer.fontWeight,
          fontStyle: layer.fontStyle,
          textDecoration: layer.textDecoration,
          textAlign: layer.textAlign,
          outline: "none",
        }}
      >
        {layer.text}
      </div>
    </div>
  );
};

export default TextLayer;