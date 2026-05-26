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
 * // Create per-instance utils to avoid conflicts with multiple editors:
 * const focusUtils = useMemo(() => createFocusUtils(), []);
 *
 * // In every toolbar <button>:
 * <button onMouseDown={focusUtils.preventBlur} onClick={doSomething} />
 *
 * // Wrap every <DropdownMenuTrigger>, <PopoverTrigger>, <SelectTrigger>:
 * <span onMouseDown={focusUtils.preventBlur}>
 *   <DropdownMenuTrigger asChild>...</DropdownMenuTrigger>
 * </span>
 *
 * // Inside every <DropdownMenuItem> handler that runs a command:
 * <DropdownMenuItem onSelect={() => { focusUtils.runWithSavedSelection(editor, c => c.toggleBold()); }}>
 *
 * // On toolbar row and header row:
 * <div onMouseDown={(e) => focusUtils.guardToolbarMouseDown(e)}>
 */

import { TextSelection } from 'prosemirror-state';

let activeEditorInstance = null;

/**
 * Create per-instance focus utils to avoid conflicts when multiple
 * editor instances are mounted simultaneously (e.g., diff view, side-by-side).
 * 
 * @returns {Object} Focus utilities instance
 */
export function createFocusUtils() {
  // Per-instance state - NOT shared across editors
  let _savedSelection = null;
  let _isToolbarInteraction = false;
  let _toolbarInteractionTimer = null;
  let _recentInteractionTimer = null;

  /**
   * Call this as `onMouseDown={preventBlur}` on any toolbar element.
   * Prevents the browser from moving focus away from the editor on mousedown.
   */
  function preventBlur(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    markToolbarInteraction();
  }

  /**
   * Snapshot the editor's current ProseMirror selection into _savedSelection.
   */
  function saveSelection(editor) {
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

  function getSelectionSnapshot(editor) {
    if (!editor || editor.isDestroyed) return null;

    if (_savedSelection) {
      return { ..._savedSelection };
    }

    const fallback = editor.storage?.athena_lastSelection;
    if (fallback) {
      return { ...fallback };
    }

    try {
      const { selection } = editor.state;
      return {
        from: selection.from,
        to: selection.to,
        anchor: selection.anchor,
        head: selection.head,
        type: selection.constructor.name,
      };
    } catch {
      return null;
    }
  }

  /**
   * Restore the previously saved ProseMirror selection and re-focus the editor.
   * 
   * @param {Object} editor - TipTap editor instance
   * @param {Object} opts - Options object
   * @param {boolean} opts.focus - Whether to focus the editor after restoring (default: true)
   * @param {Function} opts.remapPositions - Optional function to remap positions (e.g., for pagination)
   *                                         Takes (from, to) and returns { from, to }
   */
  function restoreSelection(editor, opts = {}) {
    if (!editor || editor.isDestroyed) return;

    const { focus = true, remapPositions } = opts;
    const snapshot = getSelectionSnapshot(editor);
    if (!snapshot) return;

    try {
      const { state, view } = editor;
      const { doc } = state;
      const maxPos = doc.content.size;

      let anchor = Math.min(Math.max(0, snapshot.anchor), maxPos);
      let head = Math.min(Math.max(0, snapshot.head), maxPos);

      // Allow custom position remapping (e.g., for pagination adjustments)
      if (remapPositions && typeof remapPositions === 'function') {
        const remapped = remapPositions(anchor, head);
        anchor = Math.min(Math.max(0, remapped.from), maxPos);
        head = Math.min(Math.max(0, remapped.to), maxPos);
      }

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
    } catch (_err) {
      if (focus && !editor.isDestroyed) {
        try { editor.commands.focus(); } catch { void 0; }
      }
    }
  }

  function getSavedSelection() {
    return _savedSelection ? { ..._savedSelection } : null;
  }

  function clearSavedSelection() {
    _savedSelection = null;
  }

  /**
   * Attach this as `onMouseDown` on BOTH the header row AND the toolbar row.
   */
  function guardToolbarMouseDown(e) {
    const editor = arguments.length > 1 ? arguments[1] : null;
    if (editor && !editor.isDestroyed) {
      saveSelection(editor);
    }
    markToolbarInteraction();
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
  }

  /**
   * Guard specifically for editor-associated toolbar interactions.
   * Saves selection for the specific editor instance.
   */
  function guardEditorToolbarMouseDown(editor) {
    if (editor && !editor.isDestroyed) {
      saveSelection(editor);
    }
    guardToolbarMouseDown();
  }

  /**
   * The recommended way to run a Tiptap chain command from a toolbar element.
   * 
   * @param {Editor} editor - TipTap editor instance
   * @param {Function} commandFn - Function that takes a chain and returns a chain
   * @param {Object} options - Additional options
   * @param {boolean} options.skipRestore - Skip selection restoration (useful for copy/paste)
   * @param {boolean} options.preserveFocus - Preserve current focus state
   * @param {boolean} options.forceRestore - Force restore even if no saved selection exists
   */
  function runWithSavedSelection(editor, commandFn, options = {}) {
    if (!editor || editor.isDestroyed) return false;

    const { skipRestore = false, preserveFocus = false, forceRestore = false } = options;

    try {
      let chain = editor.chain();
      const snapshot = getSelectionSnapshot(editor);

      // Only restore selection if it was previously saved and we're not skipping restore
      if (snapshot && !skipRestore) {
        const { state } = editor;
        const maxPos = state.doc.content.size;
        const anchor = Math.min(Math.max(0, snapshot.anchor), maxPos);
        const head = Math.min(Math.max(0, snapshot.head), maxPos);

        if (anchor !== head) {
          chain = chain.setTextSelection({ from: Math.min(anchor, head), to: Math.max(anchor, head) });
        } else {
          chain = chain.setTextSelection(anchor);
        }
      } else if (forceRestore && !skipRestore) {
        // If no saved selection but forceRestore is true, use current selection
        const { selection } = editor.state;
        chain = chain.setTextSelection(selection);
      }

      // Only focus if not preserving focus
      if (!preserveFocus) {
        chain = chain.focus();
      }

      // Run the command function and guard against missing chain methods.
      // The most common cause of "chain.X is not a function" is calling a
      // command from @tiptap/extension-table (e.g. insertTable) when the
      // project uses a custom table extension (insertCustomTable).
      // This wrapper surfaces that as a clear console warning instead of
      // a silent catch that swallows the real error.
      let resultChain;
      try {
        resultChain = commandFn(chain);
      } catch (cmdErr) {
        // Re-throw TypeError so callers can see the real missing-method name
        console.error(
          '[focusUtils] commandFn threw — likely calling a chain method that does not exist.',
          'Check that the Tiptap extension for this command is registered in the editor.',
          cmdErr
        );
        throw cmdErr;
      }

      let result = false;
      if (resultChain && typeof resultChain.run === 'function') {
        result = resultChain.run();
      } else {
        result = true;
      }

      // Focus restoration with scroll prevention
      if (!preserveFocus && !skipRestore) {
        const view = editor.view;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!editor.isDestroyed && view && view.dom) {
              view.dom.focus({ preventScroll: true });
            }
          });
        });
      }

      return result;
    } catch (err) {
      console.error('[focusUtils] runWithSavedSelection error:', err);
      return false;
    }
  }

  /**
   * Focus the editor without triggering a scroll jump.
   */
  function focusEditorSafely(editor) {
    if (!editor || editor.isDestroyed) return;
    try {
      if (typeof editor.commands?.focus === 'function') {
        editor.commands.focus(undefined, { scrollIntoView: false });
        return;
      }
    } catch {
      void 0;
    }

    try {
      const view = editor.view;
      if (view && view.dom) {
        view.dom.focus({ preventScroll: true });
      }
    } catch {
      try { editor.commands.focus(); } catch { void 0; }
    }
  }

  function setActiveEditor(editor) {
    if (!editor || editor.isDestroyed) return;
    activeEditorInstance = editor;
  }

  function getActiveEditor(preferredEditor = null) {
    if (preferredEditor && !preferredEditor.isDestroyed) {
      return preferredEditor;
    }

    if (activeEditorInstance && !activeEditorInstance.isDestroyed) {
      return activeEditorInstance;
    }

    return null;
  }

  function refocusActiveEditor(preferredEditor = null) {
    const editor = getActiveEditor(preferredEditor);
    if (!editor) return;

    markToolbarInteraction();
    requestAnimationFrame(() => {
      if (!editor.isDestroyed) {
        focusEditorSafely(editor);
      }
    });
  }

  /**
   * Mark that a toolbar interaction is in progress.
   */
  function markToolbarInteraction() {
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

  function isToolbarInteractionActive() {
    return _isToolbarInteraction || Boolean(window.isToolbarInteraction);
  }

  function useToolbarMouseDown(editor) {
    return function handleToolbarMouseDown() {
      guardEditorToolbarMouseDown(editor);
    };
  }

  function useDropdownGuard(editor) {
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

  function onMenuOpen(editor) {
    if (editor && !editor.isDestroyed) {
      saveSelection(editor);
      setActiveEditor(editor);
    }
    markToolbarInteraction();
  }

  function onMenuClose(_editor) {
    // Intentional no-op
  }

  // Return all utilities bound to this instance's state
  return {
    preventBlur,
    preventEditorBlur: preventBlur,
    saveSelection,
    getSelectionSnapshot,
    restoreSelection,
    getSavedSelection,
    clearSavedSelection,
    guardToolbarMouseDown,
    guardEditorToolbarMouseDown,
    runWithSavedSelection,
    focusEditorSafely,
    setActiveEditor,
    getActiveEditor,
    refocusActiveEditor,
    markToolbarInteraction,
    isToolbarInteractionActive,
    useToolbarMouseDown,
    useDropdownGuard,
    onMenuOpen,
    onMenuClose,
  };
}

// Backward compatibility: export a default instance for existing code
// BUT NOTE: This will have the same multi-editor conflict issue
const defaultInstance = createFocusUtils();
export default defaultInstance;
