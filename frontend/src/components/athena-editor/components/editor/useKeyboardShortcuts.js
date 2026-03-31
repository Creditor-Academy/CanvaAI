
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook to handle keyboard shortcuts for the editor
 * 
 * Uses refs to store handlers, preventing constant re-registration of event listeners
 * when parent component passes inline arrow functions as props.
 * 
 * @param {Object} editor - The Tiptap editor instance
 * @param {Object} handlers - Dictionary of handler functions
 */
export const useKeyboardShortcuts = (editor, handlers = {}) => {
    // Store handlers in ref — never stale, never causes re-registration
    const handlersRef = useRef(handlers);
    
    // Sync handlers on every render (no dependencies)
    useEffect(() => {
        handlersRef.current = handlers;
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Get latest handlers from ref (always fresh)
            const { 
                onSave, 
                onPrint, 
                onSearch, 
                onHelp, 
                onNewDocument, 
                onOpenDocument 
            } = handlersRef.current;
            
            // Check for modifier keys (Ctrl or Command on Mac)
            const isMod = e.ctrlKey || e.metaKey;
            const isShift = e.shiftKey;
            const isAlt = e.altKey;

            // Undo / Redo fallbacks to ensure reliability across platforms
            // Fix: Only prevent default if event target is inside editor
            const isInsideEditor = e.target?.closest?.('.ProseMirror');
            
            if (isMod && !isShift && e.key.toLowerCase() === 'z') {
                if (editor && isInsideEditor) {
                    e.preventDefault();
                    editor.chain().focus().undo().run();
                }
                return;
            }
            if ((isMod && isShift && e.key.toLowerCase() === 'z') || (isMod && e.key.toLowerCase() === 'y')) {
                if (editor && isInsideEditor) {
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
    }, [editor]); // Only re-register when editor identity changes
};
