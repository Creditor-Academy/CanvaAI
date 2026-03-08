export const createEditorCommands = ({ toast, runWithSavedSelection, initializePagination }) => {
  const handleFileAction = (action, editor) => {
    switch (action) {
      case 'new':
        if (window.confirm('Are you sure you want to create a new document? Your current changes will be lost.')) {
          editor?.commands.clearContent();
        }
        break;
      case 'open':
        break;
      case 'save':
        break;
      case 'print':
        window.print();
        break;
      default:
        break;
    }
  };

  const handleViewAction = (action, editorActions, zoom) => {
    switch (action) {
      case 'zoom_in':
        editorActions.setZoom(prev => {
          const newZoom = Math.min(200, prev + 10);
          return Math.round(newZoom / 10) * 10;
        });
        break;
      case 'zoom_out':
        editorActions.setZoom(prev => {
          const newZoom = Math.max(50, prev - 10);
          return Math.round(newZoom / 10) * 10;
        });
        break;
      case 'zoom_100':
        editorActions.setZoom(100);
        break;
      case 'zoom_50':
        editorActions.setZoom(50);
        toast?.success?.('Zoom set to 50%');
        break;
      case 'zoom_75':
        editorActions.setZoom(80);
        toast?.success?.('Zoom set to 80%');
        break;
      case 'zoom_125':
        editorActions.setZoom(130);
        break;
      case 'zoom_150':
        editorActions.setZoom(150);
        break;
      case 'zoom_200':
        editorActions.setZoom(200);
        break;
      case 'fullscreen':
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
        break;
      default:
        if (action.startsWith('zoom_')) {
          const zoomValue = parseInt(action.split('_')[1]);
          if (!isNaN(zoomValue)) {
            editorActions.setZoom(zoomValue);
          }
        }
        break;
    }
  };

  const handleEditAction = (action, editor, evt = null, handleCopy, handlePaste) => {
    if (!editor) return;
    switch (action) {
      case 'undo':
        editor.chain().undo().run();
        break;
      case 'redo':
        editor.chain().redo().run();
        break;
      case 'cut':
        handleCopy();
        editor.commands.deleteSelection();
        break;
      case 'copy':
        handleCopy();
        break;
      case 'paste':
        evt && evt.preventDefault();
        handlePaste(evt);
        break;
      case 'paste_plain':
        if (evt) {
          evt.preventDefault();
          const text = evt.clipboardData.getData('text/plain');
          editor.commands.insertContent(text);
        }
        break;
      case 'select_all':
        editor.chain().selectAll().run();
        break;
      case 'find': {
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) searchInput.focus();
        break;
      }
      default:
        break;
    }
  };

  const handleInsertAction = (action, editor) => {
    if (!editor) return;
    switch (action) {
      case 'image': {
        const url = prompt('Enter image URL:');
        if (url) runWithSavedSelection(editor, (chain) => chain.setImage({ src: url }));
        break;
      }
      case 'table': {
        if (editor.can().insertCustomTable) {
          runWithSavedSelection(editor, (chain) => chain.insertCustomTable({
            rows: 3,
            cols: 3,
            cells: Array(3).fill().map(() => Array(3).fill('')),
            borderColor: '#d1d5db',
            fontSize: 14,
            color: '#000000',
            textAlign: 'left'
          }));
        } else {
          runWithSavedSelection(editor, (chain) => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }));
        }
        setTimeout(() => {
          if (editor) initializePagination(editor);
        }, 100);
        break;
      }
      case 'link': {
        const linkUrl = prompt('Enter URL:');
        if (linkUrl) runWithSavedSelection(editor, (chain) => chain.setLink({ href: linkUrl }));
        break;
      }
      case 'page_break':
        runWithSavedSelection(editor, (chain) => chain.insertContent({ type: 'pageBreak' }));
        break;
      case 'date': {
        const date = new Date().toLocaleDateString();
        runWithSavedSelection(editor, (chain) => chain.insertContent(date));
        break;
      }
      case 'time': {
        const time = new Date().toLocaleTimeString();
        runWithSavedSelection(editor, (chain) => chain.insertContent(time));
        break;
      }
      case 'symbol': {
        const symbol = prompt('Enter symbol (e.g., ©, ®, ™):', '©');
        if (symbol) runWithSavedSelection(editor, (chain) => chain.insertContent(symbol));
        break;
      }
      case 'equation':
        runWithSavedSelection(editor, (chain) => chain.insertContent('\\\\[E = mc^2\\\\]'));
        break;
      case 'code_block':
        editor.chain().toggleCodeBlock().run();
        break;
      case 'quote':
        editor.chain().toggleBlockquote().run();
        break;
      default:
        break;
    }
  };

  const handleFormatAction = (action, editor) => {
    if (!editor) return;
    try {
      const sel = editor.state?.selection;
      const from = sel?.from ?? null;
      const to = sel?.to ?? null;
      try { editor.view?.dom?.focus?.({ preventScroll: true }); } catch { void 0 }
      let chain = editor.chain();
      if (from !== null && to !== null) {
        chain = chain.setTextSelection({ from, to, scrollIntoView: false });
      }
      switch (action) {
        case 'bold':
          chain.toggleBold().run();
          break;
        case 'italic':
          chain.toggleItalic().run();
          break;
        case 'underline':
          chain.toggleUnderline().run();
          break;
        case 'strike':
          chain.toggleStrike().run();
          break;
        case 'superscript':
          chain.toggleSuperscript().run();
          break;
        case 'subscript':
          chain.toggleSubscript().run();
          break;
        default:
          break;
      }
    } catch { void 0 }
  };

  return {
    handleFileAction,
    handleViewAction,
    handleEditAction,
    handleInsertAction,
    handleFormatAction,
  };
};

export default createEditorCommands;
