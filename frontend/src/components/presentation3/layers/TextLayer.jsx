import React from "react";
import usePresentationStore from "../store/usePresentationStore";
import { SlateStaticRenderer } from "../editors/slate/slateRenderer";
import SlateTextEditor from "../editors/slate/SlateTextEditor";

const TextLayer = ({ layer, isEditing }) => {
  const { updateTextLayer } = usePresentationStore();

  const handleSlateChange = (newValue) => {
    updateTextLayer(layer.id, { content: newValue, hasBeenEdited: true }, false);
  };

  const isPlaceholderVisible =
    !layer.hasBeenEdited &&
    (!layer.content ||
      (layer.content.length === 1 &&
        layer.content[0].children[0].text === ""));

  // Base container styles, removing conflicting text styles
  const containerStyle = {
    width: "100%",
    height: "100%",
    outline: "none",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    lineHeight: 1.2,
    cursor: isEditing ? "text" : "move",
  };

  // Styles to be passed down to the editor/renderer for inheritance
  const textBlockStyle = {
    fontFamily: layer.fontFamily,
    fontSize: `${layer.fontSize}px`,
    textAlign: layer.textAlign,
  };

  if (isEditing) {
    return (
      <div style={containerStyle}>
        <SlateTextEditor
          value={
            layer.content || [{ type: "paragraph", children: [{ text: "" }] }]
          }
          onChange={handleSlateChange}
          style={textBlockStyle} // Pass the correct inheritable styles
        />
      </div>
    );
  }

  return (
    <div style={{ ...containerStyle, ...textBlockStyle }}>
      {isPlaceholderVisible ? (
        <span style={{ color: "#94a3b8" }}>
          {layer.placeholder || "Click to add text"}
        </span>
      ) : (
        <SlateStaticRenderer value={layer.content} />
      )}
    </div>
  );
};

export default TextLayer;