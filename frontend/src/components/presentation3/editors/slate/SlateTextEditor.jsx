import React, { useMemo, useCallback, useEffect } from "react";
import { createEditor, Editor } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { withHistory } from "slate-history";
import { Leaf, Element } from "./slateRenderer";
import { toggleMark, applyMark } from "./slateMarks";
import { toggleBlock, setBlockStyle } from "./slateBlocks";
import usePresentationStore from "../../store/usePresentationStore";

const SlateTextEditor = ({ value, onChange, style }) => {
  const editor = useMemo(
    () => withHistory(withReact(createEditor())),
    []
  );

  const { setSelectionMarks, setActiveEditor } = usePresentationStore();

  const renderElement = useCallback(
    (props) => <Element {...props} />,
    []
  );


  const renderLeaf = useCallback(
    (props) => <Leaf {...props} />,
    []
  );

  const handleSlateChange = (val) => {
    onChange(val);

    // Only update selection marks if the selection actually changed
    // This reduces re-renders of the PropertiesPanel during typing
    if (editor.selection) {
      const marks = Editor.marks(editor) || {};
      const currentMarks = usePresentationStore.getState().selectionMarks;
      // Simple keys check is usually enough to detect mark changes
      const marksChanged = Object.keys(marks).length !== Object.keys(currentMarks).length ||
        Object.keys(marks).some(k => marks[k] !== currentMarks[k]);

      if (marksChanged) {
        setSelectionMarks(marks);
      }
    }
  };


  // ✅ Sync external value safely (e.g. for Undo/Redo or external updates)
  useEffect(() => {
    // We only want to sync if the external value has changed significantly 
    // AND it's not the same as our current internal state.
    const isDifferent = JSON.stringify(value) !== JSON.stringify(editor.children);

    if (value && isDifferent) {
      // To preserve selection, we should ideally use Transforms.setNodes or similar
      // but for a full value sync from Undo/Redo, resetting children is fine 
      // as long as it's not happening during every keystroke.
      editor.children = value;
      editor.onChange();
    }
  }, [value, editor]);

  // ✅ Inject fontFamily as active typing mark
  useEffect(() => {
    if (style?.fontFamily) {
      Editor.addMark(editor, "fontFamily", style.fontFamily);
    }
  }, [editor, style?.fontFamily]);

  useEffect(() => {
    const handleToggleMark = (e) => {
      toggleMark(editor, e.detail.format);
    };

    const handleApplyMark = (e) => {
      applyMark(editor, e.detail.format, e.detail.value);
    };

    const handleToggleBlock = (e) => {
      toggleBlock(editor, e.detail.format);
    };

    const handleSetBlockStyle = (e) => {
      setBlockStyle(editor, e.detail.properties);
    };

    window.addEventListener("slate-toggle-mark", handleToggleMark);
    window.addEventListener("slate-apply-mark", handleApplyMark);
    window.addEventListener("slate-toggle-block", handleToggleBlock);
    window.addEventListener("slate-set-block-style", handleSetBlockStyle);

    return () => {
      window.removeEventListener("slate-toggle-mark", handleToggleMark);
      window.removeEventListener("slate-apply-mark", handleApplyMark);
      window.removeEventListener("slate-toggle-block", handleToggleBlock);
      window.removeEventListener("slate-set-block-style", handleSetBlockStyle);
    };
  }, [editor]);


  return (
    <Slate editor={editor} initialValue={value} onChange={handleSlateChange}>
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        placeholder="Enter text..."
        style={{
          outline: "none",
          minHeight: "1em",
          ...style, // fontFamily, fontSize, textAlign inherited
        }}
        onFocus={() => {
          setActiveEditor(editor);
        }}
        onBlur={() => {
          // Add a small timeout to avoid clearing the active editor before property panel can use it
          // OR better: only clear if this specific editor was the active one
          setTimeout(() => {
            if (usePresentationStore.getState().activeEditor === editor) {
              setActiveEditor(null);
            }
          }, 150);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            const { selection } = editor;
            if (selection && Editor.unhangRange(editor, selection)) {
              const [match] = Editor.nodes(editor, {
                match: n => n.type === 'list-item',
              });

              if (match) {
                const [node, path] = match;
                const isEmpty = Editor.isEmpty(editor, node);

                if (isEmpty) {
                  event.preventDefault();
                  toggleBlock(editor, "bulleted-list"); // toggleBlock(editor, "bulleted-list") unwraps any list type because of our refactored logic
                  return;
                }
              }
            }
          }

          if (!event.ctrlKey) return;

          switch (event.key) {
            case "b":
              event.preventDefault();
              toggleMark(editor, "bold");
              break;
            case "i":
              event.preventDefault();
              toggleMark(editor, "italic");
              break;
            case "u":
              event.preventDefault();
              toggleMark(editor, "underline");
              break;
            default:
              break;
          }
        }}
      />

    </Slate>
  );
};

export default SlateTextEditor;
