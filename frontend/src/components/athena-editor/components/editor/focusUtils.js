/**
 * focusUtils.js
 * =============
 * Utilities to prevent the editor from losing its selection when the user
 * interacts with toolbar buttons, dropdowns, popovers, and select menus.
 *
 * ROOT CAUSE
 * ----------
 * The browser fires events in this order when you click a toolbar element:
 *   mousedown  →  (editor loses focus / blur fires here)  →  mouseup  →  click
 *
 * For a simple <button> we can call e.preventDefault() on mousedown to stop
 * the browser from moving focus away from the editor.
 *
 * For Radix UI Dropdowns / Popovers / Selects this is not enough because:
 *   1. Radix's trigger <button> captures focus on mousedown internally.
 *   2. The dropdown portal is appended to document.body, so focus jumps there.
 *   3. Keyboard navigation inside the portal further moves focus around.
 *
 * SOLUTION — three cooperative layers
 * ------------------------------------
 * Layer 1 – preventBlur(e)
 *   Call on the `onMouseDown` of every toolbar element (button OR dropdown
 *   wrapper). Calling e.preventDefault() stops the browser's default
 *   focus-transfer behaviour. Radix still receives the synthetic React click
 *   event so the dropdown opens normally.
 *
 * Layer 2 – saveSelection(editor) / restoreSelection(editor)
 *   Save a snapshot of ProseMirror's current selection into a module-level
 *   ref. Restore it before executing any command that was triggered from
 *   outside the editor (dropdown item clicks, popover actions, etc.).
 *
 * Layer 3 – guardToolbarMouseDown(e, editor)
 *   A single onMouseDown handler attached to BOTH the header row AND the
 *   toolbar row. It saves the selection and calls preventDefault so that
 *   clicking anywhere in the chrome area never blurs the editor.
 *
 * USAGE
 * -----
 * // In every toolbar <button>:
 * <button onMouseDown={preventBlur} onClick={doSomething} />
 *
 * // Wrap every <DropdownMenuTrigger>, <PopoverTrigger>, <SelectTrigger>:
 * <span onMouseDown={preventBlur}>
 *   <DropdownMenuTrigger asChild>...</DropdownMenuTrigger>
 * </span>
 *
 * // Inside every <DropdownMenuItem> handler that runs a command:
 * <DropdownMenuItem onSelect={() => { runWithSavedSelection(editor, c => c.toggleBold()); }}>
 *
 * // On toolbar row and header row:
 * <div onMouseDown={(e) => guardToolbarMouseDown(e, editor)}>
 */

import { TextSelection } from 'prosemirror-state';

// ─── Module-level selection snapshot ─────────────────────────────────────────
let _savedSelection = null;
let _isToolbarInteraction = false;
let _toolbarInteractionTimer = null;
let _recentInteractionTimer = null;

/**
 * Call this as `onMouseDown={preventBlur}` on any toolbar element.
 * Prevents the browser from moving focus away from the editor on mousedown.
 */
export function preventBlur(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
}

/**
 * Snapshot the editor's current ProseMirror selection into _savedSelection.
 */
export function saveSelection(editor) {
  if (!editor || editor.isDestroyed) return false;

  try {
    const { selection } = editor.state;
    _savedSelection = {
      from: selection.from,
      to: selection.to,
      anchor: selection.anchor,
      head: selection.head,
      type: selection.constructor.name,
    };
    return selection.from !== selection.to;
  } catch {
    _savedSelection = null;
    return false;
  }
}

/**
 * Restore the previously saved ProseMirror selection and re-focus the editor.
 */
export function restoreSelection(editor, opts = {}) {
  if (!editor || editor.isDestroyed || !_savedSelection) return;

  const { focus = true } = opts;

  try {
    const { state, view } = editor;
    const { doc } = state;
    const maxPos = doc.content.size;

    const anchor = Math.min(Math.max(0, _savedSelection.anchor), maxPos);
    const head = Math.min(Math.max(0, _savedSelection.head), maxPos);

    const sel = TextSelection.create(doc, anchor, head);
    const tr = state.tr.setSelection(sel);
    view.dispatch(tr);

    if (focus) {
      Promise.resolve().then(() => {
        if (!editor.isDestroyed) {
          view.focus();
        }
      });
    }
  } catch (err) {
    if (focus && !editor.isDestroyed) {
      try { editor.commands.focus(); } catch { void 0; }
    }
  }
}

export function getSavedSelection() {
  return _savedSelection ? { ..._savedSelection } : null;
}

export function clearSavedSelection() {
  _savedSelection = null;
}

/**
 * Attach this as `onMouseDown` on BOTH the header row AND the toolbar row.
 */
export function guardToolbarMouseDown(e, editor) {
  if (editor && !editor.isDestroyed) {
    saveSelection(editor);
  }
  markToolbarInteraction();
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
}

/**
 * The recommended way to run a Tiptap chain command from a toolbar element.
 */
export function runWithSavedSelection(editor, commandFn) {
  if (!editor || editor.isDestroyed) return false;

  try {
    let chain = editor.chain();

    if (_savedSelection) {
      const { state } = editor;
      const maxPos = state.doc.content.size;
      const anchor = Math.min(Math.max(0, _savedSelection.anchor), maxPos);
      const head = Math.min(Math.max(0, _savedSelection.head), maxPos);

      if (anchor !== head) {
        chain = chain.setTextSelection({ from: Math.min(anchor, head), to: Math.max(anchor, head) });
      } else {
        chain = chain.setTextSelection(anchor);
      }
    }

    chain = chain.focus();
    const resultChain = commandFn(chain);

    let result = false;
    if (resultChain && typeof resultChain.run === 'function') {
      result = resultChain.run();
    } else {
      result = true;
    }

    const view = editor.view;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!editor.isDestroyed && view && view.dom) {
          view.dom.focus({ preventScroll: true });
        }
      });
    });

    return result;
  } catch (err) {
    console.error('[focusUtils] runWithSavedSelection error:', err);
    return false;
  }
}

/**
 * Focus the editor without triggering a scroll jump.
 */
export function focusEditorSafely(editor) {
  if (!editor || editor.isDestroyed) return;
  try {
    const view = editor.view;
    if (view && view.dom) {
      view.dom.focus({ preventScroll: true });
    }
  } catch {
    try { editor.commands.focus(); } catch { void 0; }
  }
}

/**
 * Mark that a toolbar interaction is in progress.
 */
export function markToolbarInteraction() {
  _isToolbarInteraction = true;
  window.isToolbarInteraction = true;

  if (_toolbarInteractionTimer) clearTimeout(_toolbarInteractionTimer);
  _toolbarInteractionTimer = setTimeout(() => {
    _isToolbarInteraction = false;
    window.isToolbarInteraction = false;
  }, 200);

  window.wasToolbarInteractionRecent = true;
  if (_recentInteractionTimer) clearTimeout(_recentInteractionTimer);
  _recentInteractionTimer = setTimeout(() => {
    window.wasToolbarInteractionRecent = false;
  }, 600);
}

export function isToolbarInteractionActive() {
  return _isToolbarInteraction || Boolean(window.isToolbarInteraction);
}

export function useToolbarMouseDown(editor) {
  return function handleToolbarMouseDown(e) {
    guardToolbarMouseDown(e, editor);
  };
}

export function useDropdownGuard(editor) {
  function onMouseDown(e) {
    if (editor && !editor.isDestroyed) saveSelection(editor);
    markToolbarInteraction();
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
  }

  function onOpenChange(open) {
    if (open) {
      if (editor && !editor.isDestroyed) saveSelection(editor);
      markToolbarInteraction();
    }
  }

  return {
    triggerProps: { onMouseDown },
    onOpenChange,
  };
}

export const preventEditorBlur = preventBlur;

export function onMenuOpen(editor) {
  if (editor && !editor.isDestroyed) saveSelection(editor);
  markToolbarInteraction();
}

export function onMenuClose(_editor) {
  // Intentional no-op
}