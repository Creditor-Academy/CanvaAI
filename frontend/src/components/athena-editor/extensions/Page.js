import { Node } from '@tiptap/core';
import { A4_HEIGHT_PX, A4_WIDTH_PX, TOP_MARGIN_PX, BOTTOM_MARGIN_PX, LEFT_MARGIN_PX, RIGHT_MARGIN_PX, USABLE_HEIGHT_PX, USABLE_WIDTH_PX } from '../../../utils/pagination/constants';

export const PAGE_HEIGHT = A4_HEIGHT_PX;
export const PAGE_WIDTH = A4_WIDTH_PX;
export const TOP_MARGIN = TOP_MARGIN_PX;
export const BOTTOM_MARGIN = BOTTOM_MARGIN_PX;
export const LEFT_MARGIN = LEFT_MARGIN_PX;
export const RIGHT_MARGIN = RIGHT_MARGIN_PX;
export const USABLE_HEIGHT = USABLE_HEIGHT_PX;
export const USABLE_WIDTH = USABLE_WIDTH_PX;

export const Page = Node.create({
    name: 'page',
    group: 'block',
    content: 'block+',
    draggable: false,
    selectable: false,
    attrs: {
        pageNumber: { default: 1 },
        isBlank: { default: false },
    },
    parseHTML() {
        return [
            {
                tag: 'div[data-type="page"]',
            },
        ];
    },
    renderHTML({ node, HTMLAttributes }) {
        return [
            'div',
            {
                'data-type': 'page',
                'data-page-number': node.attrs.pageNumber,
                class: `athena-page ${node.attrs.isBlank ? 'is-blank' : ''}`,
                style: `min-height: ${PAGE_HEIGHT}px; width: ${PAGE_WIDTH}px; padding: ${TOP_MARGIN}px ${RIGHT_MARGIN}px ${BOTTOM_MARGIN}px ${LEFT_MARGIN}px;`,
                ...HTMLAttributes,
            },
            0,
        ];
    },
});

export const initializePagination = (editorInstance) => {
    if (!editorInstance || editorInstance.isDestroyed) return;
    try {
        if (!editorInstance.state || !editorInstance.state.doc) return;
        const { state } = editorInstance;

        // Count existing page nodes (only at the top level of the document)
        const pageNodes = [];
        state.doc.forEach(node => {
            if (node.type.name === 'page') pageNodes.push(node);
        });

        if (pageNodes.length > 0) {
            // Doc already has pages — do NOT re-wrap.
            // Only ensure the first page has at least one paragraph if it is empty.
            const firstPage = pageNodes[0];
            if (!firstPage.content || firstPage.content.size === 0) {
                const insertPos = 1; // position 0 is doc start, 1 is inside first page
                try {
                    const tr = state.tr.insert(insertPos, state.schema.node('paragraph'));
                    editorInstance.view.dispatch(tr);
                } catch { void 0; }
            }
            return; // ← Early return: pages already exist, nothing more to do
        }

        // No pages exist yet — collect top-level content nodes and wrap them
        // in a single starter page. The pagination engine will split into
        // multiple pages on the next repaginate() run.
        const contentNodes = [];
        state.doc.forEach(node => {
            // Only collect recognised block types; skip unknown/page nodes
            if (
                ['paragraph', 'heading', 'bulletList', 'orderedList', 'taskList',
                    'blockquote', 'codeBlock', 'horizontalRule', 'table', 'image'].includes(node.type.name)
            ) {
                contentNodes.push(node);
            }
        });

        try {
            const { schema } = state;
            const pageContent = contentNodes.length > 0
                ? contentNodes
                : [schema.node('paragraph')];

            const pageNode = schema.node('page', { pageNumber: 1, isBlank: false }, pageContent);
            const tr = state.tr.replaceWith(0, state.doc.content.size, pageNode);
            editorInstance.view.dispatch(tr);
        } catch (setContentError) {
            console.warn('[initializePagination] Failed to wrap content, inserting blank page:', setContentError);
            try {
                const tr = state.tr.replaceWith(
                    0, state.doc.content.size,
                    state.schema.node('page', { pageNumber: 1, isBlank: true }, [state.schema.node('paragraph')])
                );
                editorInstance.view.dispatch(tr);
            } catch { void 0; }
        }
    } catch (error) {
        console.warn('[initializePagination] Outer error, attempting recovery:', error);
        try {
            if (editorInstance && !editorInstance.isDestroyed) {
                const { state } = editorInstance;
                const tr = state.tr.replaceWith(
                    0, state.doc.content.size,
                    state.schema.node('page', { pageNumber: 1, isBlank: true }, [state.schema.node('paragraph')])
                );
                editorInstance.view.dispatch(tr);
            }
        } catch { void 0; }
    }
};

export const addHeadingStyles = () => {
    const styleId = 'athena-heading-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
    .ProseMirror h1, .prose .ProseMirror h1, .prose-lg .ProseMirror h1 { font-size: 2.5rem !important; font-weight: 800 !important; line-height: 1.15 !important; margin-top: 0.75rem !important; margin-bottom: 0.25rem !important; color: #1f2937 !important; display: block !important; font-family: Georgia, serif !important; }
    .ProseMirror h2, .prose .ProseMirror h2, .prose-lg .ProseMirror h2 { font-size: 2rem !important; font-weight: 700 !important; line-height: 1.15 !important; margin-top: 0.75rem !important; margin-bottom: 0.25rem !important; color: #1f2937 !important; display: block !important; font-family: Georgia, serif !important; }
    .ProseMirror h3, .prose .ProseMirror h3, .prose-lg .ProseMirror h3 { font-size: 1.75rem !important; font-weight: 600 !important; line-height: 1.15 !important; margin-top: 0.625rem !important; margin-bottom: 0.25rem !important; color: #1f2937 !important; display: block !important; font-family: Georgia, serif !important; }
    .ProseMirror h4, .prose .ProseMirror h4, .prose-lg .ProseMirror h4 { font-size: 1.5rem !important; font-weight: 600 !important; line-height: 1.15 !important; margin-top: 0.5rem !important; margin-bottom: 0.25rem !important; color: #1f2937 !important; display: block !important; font-family: Georgia, serif !important; }
    .ProseMirror h5, .prose .ProseMirror h5, .prose-lg .ProseMirror h5 { font-size: 1.25rem !important; font-weight: 600 !important; line-height: 1.15 !important; margin-top: 0.5rem !important; margin-bottom: 0.25rem !important; color: #1f2937 !important; display: block !important; font-family: Georgia, serif !important; }
    .ProseMirror h6, .prose .ProseMirror h6, .prose-lg .ProseMirror h6 { font-size: 1.1rem !important; font-weight: 600 !important; line-height: 1.15 !important; margin-top: 0.5rem !important; margin-bottom: 0.25rem !important; color: #1f2937 !important; display: block !important; font-family: Georgia, serif !important; }
    .ProseMirror p, .prose .ProseMirror p, .prose-lg .ProseMirror p { font-size: 1rem !important; line-height: 1.2 !important; margin-top: 0 !important; margin-bottom: 0 !important; color: #374151 !important; display: block !important; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; page-break-inside: auto !important; }
    .ProseMirror [data-type="heading"] { font-family: Georgia, serif !important; page-break-after: avoid !important; page-break-inside: avoid !important; }
  `;
    document.head.appendChild(style);
};