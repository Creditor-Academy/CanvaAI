import React from "react";
import usePresentationStore from "../store/usePresentationStore";
import { SlateStaticRenderer } from "../editors/slate/slateRenderer";
import SlateTextEditor from "../editors/slate/SlateTextEditor";

const TextLayer = ({ layer, isEditing }) => {
  const { updateTextLayer } = usePresentationStore();

  const handleSlateChange = (newValue) => {
    // We update the content, but we don't call saveToHistory on every keystroke
    // as per user requirements. saveToHistory is called on enter/exit edit mode in CanvasShell.
    updateTextLayer(layer.id, { content: newValue, hasBeenEdited: true }, false);
  };

  const isPlaceholderVisible =
    !layer.hasBeenEdited && (!layer.content || (layer.content.length === 1 && layer.content[0].children[0].text === ""));

  const commonStyle = {
    width: "100%",
    height: "100%",
    fontSize: layer.fontSize,
    color: isPlaceholderVisible ? "#94a3b8" : layer.color,
    fontFamily: layer.fontFamily,
    fontWeight: layer.fontWeight,
    fontStyle: layer.fontStyle,
    textDecoration: layer.textDecoration,
    textAlign: layer.textAlign,
    outline: "none",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
    lineHeight: 1.2,
  };

  if (isEditing) {
    return (
      <div style={{ ...commonStyle, cursor: "text" }}>
        <SlateTextEditor
          value={layer.content || [{ type: 'paragraph', children: [{ text: '' }] }]}
          onChange={handleSlateChange}
          style={commonStyle}
        />
      </div>
    );
  }

  return (
    <div style={commonStyle}>
      {isPlaceholderVisible ? (
        <span>{layer.placeholder || "Click to add text"}</span>
      ) : (
        <SlateStaticRenderer value={layer.content} />
      )}
    </div>
  );
};

export default TextLayer;