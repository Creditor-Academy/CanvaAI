
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook to handle keyboard shortcuts for the editor
 * @param {Object} editor - The Tiptap editor instance
 * @param {Object} handlers - Dictionary of handler functions
 */
export const useKeyboardShortcuts = (editor, handlers = {}) => {
    const {
        onSave,
        onPrint,
        onSearch,
        onHelp,
        onNewDocument,
        onOpenDocument
    } = handlers;

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check for modifier keys (Ctrl or Command on Mac)
            const isMod = e.ctrlKey || e.metaKey;
            const isShift = e.shiftKey;
            const isAlt = e.altKey;

            // Undo / Redo fallbacks to ensure reliability across platforms
            if (isMod && !isShift && e.key.toLowerCase() === 'z') {
                if (editor) {
                    e.preventDefault();
                    editor.chain().focus().undo().run();
                }
                return;
            }
            if ((isMod && isShift && e.key.toLowerCase() === 'z') || (isMod && e.key.toLowerCase() === 'y')) {
                if (editor) {
                    e.preventDefault();
                    editor.chain().focus().redo().run();
                }
                return;
            }

            // Save: Ctrl + S
            if (isMod && e.key === 's') {
                e.preventDefault();
                if (onSave) {
                    onSave();
                    toast.success('Document saved');
                }
            }

            // Print: Ctrl + P
            if (isMod && e.key === 'p') {
                e.preventDefault();
                if (onPrint) {
                    onPrint();
                    toast.success('Print initiated (Ctrl+P)');
                }
            }

            // Find/Search: Ctrl + F
            if (isMod && e.key === 'f') {
                e.preventDefault();
                if (onSearch) {
                    onSearch();
                }
            }

            // New Document: Ctrl + Alt + N
            if (isMod && isAlt && e.key === 'n') {
                e.preventDefault();
                if (onNewDocument) {
                    onNewDocument();
                }
            }

            // Open Document: Ctrl + O
            if (isMod && e.key === 'o') {
                e.preventDefault();
                if (onOpenDocument) {
                    onOpenDocument();
                }
            }

            // Help / Keyboard Shortcuts: Ctrl + /
            if (isMod && e.key === '/') {
                e.preventDefault();
                if (onHelp) {
                    onHelp();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editor, onSave, onPrint, onSearch, onHelp, onNewDocument, onOpenDocument]);
};
