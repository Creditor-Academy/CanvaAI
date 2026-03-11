import React from "react";
import usePresentationStore from "../store/usePresentationStore";
import { SlateStaticRenderer } from "../editors/slate/slateRenderer";
import SlateTextEditor from "../editors/slate/SlateTextEditor";
import { debounce } from "lodash";

const TextLayer = ({ layer, isEditing }) => {
  const { updateTextLayer } = usePresentationStore();

  const debouncedUpdate = React.useMemo(
    () =>
      debounce((id, updates) => {
        updateTextLayer(id, updates, false);
      }, 500),
    [updateTextLayer]
  );

  const handleSlateChange = (newValue) => {
    // Immediate local state update is handled by Slate
    // but we persist to store with debounce
    debouncedUpdate(layer.id, { content: newValue, hasBeenEdited: true });
  };

  const isPlaceholderVisible =
    !layer.hasBeenEdited &&
    (!layer.content ||
      (layer.content.length === 1 &&
        layer.content[0]?.children?.[0]?.text === ""));

  const containerStyle = {
    width: "100%",
    height: "100%",
    outline: "none",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    lineHeight: 1.2,
    cursor: isEditing ? "text" : "move",
  };

  // ONLY block-level styles here
  const textBlockStyle = {
    fontFamily: layer.fontFamily,
    fontSize: `${layer.fontSize}px`,
    textAlign: layer.textAlign,
    color: layer.color || "#ffffff",
  };

  if (isEditing) {
    return (
      <div style={containerStyle}>
        <SlateTextEditor
          value={
            layer.content || [
              { type: "paragraph", children: [{ text: "" }] },
            ]
          }
          onChange={handleSlateChange}
          style={textBlockStyle}
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
