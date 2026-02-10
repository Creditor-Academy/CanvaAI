import { Editor } from "slate";

/* ============================= */
/* ===== TOGGLE BOOLEAN MARK ==== */
/* ============================= */

export const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

/* ============================= */
/* ===== APPLY VALUE MARK ====== */
/* ============================= */

export const applyMark = (editor, format, value) => {
  if (!editor.selection) return;

  // This is enough for character-level styling
  Editor.addMark(editor, format, value);
};

/* ============================= */
/* ===== CHECK BOOLEAN MARK ==== */
/* ============================= */

export const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

/* ============================= */
/* ===== GET MARK VALUE ======== */
/* ============================= */

export const getMarkValue = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] : null;
};
