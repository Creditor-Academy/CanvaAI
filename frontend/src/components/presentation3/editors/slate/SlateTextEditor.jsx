import React, { useMemo, useCallback, useEffect } from 'react';
import { createEditor, Editor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { Leaf, Element } from './slateRenderer';
import { toggleMark, applyMark } from './slateMarks';
import { toggleBlock, setBlockStyle } from './slateBlocks';
import usePresentationStore from '../../store/usePresentationStore';

const SlateTextEditor = ({ value, onChange, style }) => {
    const editor = useMemo(() => withHistory(withReact(createEditor())), []);
    const { setSelectionMarks } = usePresentationStore();

    const renderElement = useCallback(props => <Element {...props} />, []);
    const renderLeaf = useCallback(props => <Leaf {...props} />, []);

    const handleSlateChange = (val) => {
        onChange(val);

        // Selection-aware marks for Properties Panel
        if (editor.selection) {
            const marks = Editor.marks(editor) || {};
            setSelectionMarks(marks);
        }
    };

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

        window.addEventListener('slate-toggle-mark', handleToggleMark);
        window.addEventListener('slate-apply-mark', handleApplyMark);
        window.addEventListener('slate-toggle-block', handleToggleBlock);
        window.addEventListener('slate-set-block-style', handleSetBlockStyle);

        return () => {
            window.removeEventListener('slate-toggle-mark', handleToggleMark);
            window.removeEventListener('slate-apply-mark', handleApplyMark);
            window.removeEventListener('slate-toggle-block', handleToggleBlock);
            window.removeEventListener('slate-set-block-style', handleSetBlockStyle);
        };
    }, [editor]);

    // Implement controlled value synchronization
    useEffect(() => {
        // Only update if value is different and we're not currently editing? 
        // No, if value comes from store (e.g. Undo), we MUST reflect it.
        // Slate 0.90+ uses editor.children directly for its state.
        if (value && value !== editor.children) {
            editor.children = value;
            // Trigger a re-render without affecting history/selection if possible
            editor.onChange();
        }
    }, [value, editor]);

    return (
        <Slate editor={editor} initialValue={value} onChange={handleSlateChange}>
            <Editable
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder="Enter text..."
                style={{
                    outline: 'none',
                    minHeight: '1em',
                    ...style,
                    // Ensure block properties are applied to the typing area directly
                    fontFamily: style?.fontFamily || 'inherit',
                    fontSize: style?.fontSize || 'inherit',
                    textAlign: style?.textAlign || 'inherit',
                }}
                onKeyDown={event => {
                    if (!event.ctrlKey) return;

                    switch (event.key) {
                        case 'b': {
                            event.preventDefault();
                            toggleMark(editor, 'bold');
                            break;
                        }
                        case 'i': {
                            event.preventDefault();
                            toggleMark(editor, 'italic');
                            break;
                        }
                        case 'u': {
                            event.preventDefault();
                            toggleMark(editor, 'underline');
                            break;
                        }
                        default:
                            break;
                    }
                }}
            />
        </Slate>
    );
};

export default SlateTextEditor;