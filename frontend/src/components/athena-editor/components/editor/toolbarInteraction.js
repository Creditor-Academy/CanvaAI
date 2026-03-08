export const ToolbarInteraction = {
  isOpen: false,
  savedSelection: null,
  open(editor) {
    try {
      this.isOpen = true;
      document.body.setAttribute('data-menu-open', 'true');
      if (editor?.state?.selection) {
        this.savedSelection = editor.state.selection;
      }
    } catch {}
  },
  close(editor) {
    try {
      this.isOpen = false;
      document.body.setAttribute('data-menu-open', 'false');
      if (editor && this.savedSelection) {
        const { state, view } = editor;
        const tr = state.tr.setSelection(this.savedSelection);
        view.dispatch(tr);
      }
    } catch {}
    this.savedSelection = null;
  },
};
