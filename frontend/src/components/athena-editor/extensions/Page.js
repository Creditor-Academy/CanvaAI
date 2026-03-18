import { Node } from '@tiptap/core';
import {
    A4_HEIGHT_PX,
    A4_WIDTH_PX,
    PAGE_MARGIN_TOP_PX,
    PAGE_MARGIN_BOTTOM_PX,
    PAGE_MARGIN_LEFT_PX,
    PAGE_MARGIN_RIGHT_PX,
    USABLE_HEIGHT_PX,
    USABLE_WIDTH_PX
} from '../../../utils/pagination/constants';

export const PAGE_HEIGHT = A4_HEIGHT_PX;
export const PAGE_WIDTH = A4_WIDTH_PX;
export const TOP_MARGIN = PAGE_MARGIN_TOP_PX;
export const BOTTOM_MARGIN = PAGE_MARGIN_BOTTOM_PX;
export const LEFT_MARGIN = PAGE_MARGIN_LEFT_PX;
export const RIGHT_MARGIN = PAGE_MARGIN_RIGHT_PX;
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
                // No inline styles - let CSS handle everything for pageless mode
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

        // Check if document already has properly structured pages
        let hasProperPages = false;
        state.doc.forEach(node => {
            if (node.type.name === 'page' && node.content && node.content.size > 0) {
                hasProperPages = true;
            }
        });

        if (hasProperPages) {
            // Pages already exist with content - no need to re-wrap
            return;
        }

        // Collect ALL top-level content nodes (whether in pages or not)
        const contentNodes = [];
        state.doc.forEach(node => {
            // If it's a page node, extract its children
            if (node.type.name === 'page') {
                node.forEach(child => {
                    if (isValidBlockNode(child)) {
                        contentNodes.push(child);
                    }
                });
            } else if (isValidBlockNode(node)) {
                // Regular block node outside pages
                contentNodes.push(node);
            }
        });

        // Only proceed if we have content to wrap OR doc is empty
        if (contentNodes.length === 0 && state.doc.content.size > 0) {
            // Has content but not recognized blocks - leave as is
            return;
        }

        try {
            const { schema } = state;
            const pageContent = contentNodes.length > 0
                ? contentNodes
                : [schema.node('paragraph')];

            // Replace entire document content with wrapped page
            const pageNode = schema.node('page', { pageNumber: 1, isBlank: false }, pageContent);
            const tr = state.tr.replaceWith(0, state.doc.content.size, pageNode);
            editorInstance.view.dispatch(tr);

            console.log('[initializePagination] Successfully wrapped content in page');
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
    }
};

// Helper function to identify valid block nodes
const isValidBlockNode = (node) => {
    const validTypes = [
        'paragraph', 'heading', 'bulletList', 'orderedList', 'taskList',
        'blockquote', 'codeBlock', 'horizontalRule', 'table', 'image'
    ];
    return validTypes.includes(node.type.name);
};

export const addHeadingStyles = () => {
    const styleId = 'athena-heading-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
    .ProseMirror {
      background: transparent !important;
      padding: 0 !important;
      min-height: 100% !important;
      display: block !important;
      word-break: break-word !important;
    }
    
    /* Typography Overhaul - Premium Feel */
    .ProseMirror h1 { font-size: 2.75rem !important; font-weight: 800 !important; line-height: 1.2 !important; margin-bottom: 2rem !important; color: #0f172a !important; font-family: 'Outfit', 'Segoe UI', serif !important; letter-spacing: -0.02em !important; }
    .ProseMirror h2 { font-size: 2rem !important; font-weight: 700 !important; line-height: 1.3 !important; margin-top: 2.5rem !important; margin-bottom: 1rem !important; color: #1e293b !important; font-family: 'Outfit', sans-serif !important; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem; }
    .ProseMirror h3 { font-size: 1.5rem !important; font-weight: 600 !important; line-height: 1.4 !important; margin-top: 2rem !important; margin-bottom: 0.75rem !important; color: #334155 !important; font-family: 'Outfit', sans-serif !important; }
    .ProseMirror p { font-size: 1.05rem !important; line-height: 1.7 !important; margin-bottom: 1.25rem !important; color: #475569 !important; font-family: 'Inter', system-ui, sans-serif !important; }
    
    /* Document Layout Enhancements */
    .athena-workspace {
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    
    /* AI Enhanced Document Styling */
    .ai-document-enhanced {
      position: relative;
    }
    
    /* Special "Cover Page" treatment for AI docs */
    .ai-document-enhanced .ProseMirror > h1:first-child {
      text-align: center !important;
      padding: 4rem 0 2rem 0 !important;
      margin-bottom: 3rem !important;
      position: relative;
      display: block !important;
    }
    
    .ai-document-enhanced .ProseMirror > h1:first-child::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 4px;
      background: linear-gradient(90deg, #f59e0b, #fb7185);
      border-radius: 2px;
    }
    
    /* Entry animation for AI docs */
    .athena-workspace[data-ai-generated="true"] {
      animation: docReveal 1s ease-out;
    }
    
    @keyframes docReveal {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Enhanced list styling */
    .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem !important; margin-bottom: 1.25rem !important; }
    .ProseMirror li { margin-bottom: 0.5rem !important; line-height: 1.6 !important; color: #475569 !important; }
    
    /* Horizontal rules */
    .ProseMirror hr { border: none !important; border-top: 2px solid #f1f5f9 !important; margin: 3rem 0 !important; }
  `;
    document.head.appendChild(style);
};