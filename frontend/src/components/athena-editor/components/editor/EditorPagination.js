import { 
  A4_HEIGHT_PX, 
  A4_WIDTH_PX, 
  PAGE_MARGIN_TOP_PX, 
  PAGE_MARGIN_BOTTOM_PX, 
  PAGE_MARGIN_LEFT_PX, 
  PAGE_MARGIN_RIGHT_PX, 
  USABLE_HEIGHT_PX, 
  USABLE_WIDTH_PX 
} from '../../../../utils/pagination/constants';

export const PAGE_HEIGHT = A4_HEIGHT_PX;
export const PAGE_WIDTH = A4_WIDTH_PX;
export const TOP_MARGIN = PAGE_MARGIN_TOP_PX;
export const BOTTOM_MARGIN = PAGE_MARGIN_BOTTOM_PX;
export const LEFT_MARGIN = PAGE_MARGIN_LEFT_PX;
export const RIGHT_MARGIN = PAGE_MARGIN_RIGHT_PX;
export const USABLE_HEIGHT = USABLE_HEIGHT_PX;
export const USABLE_WIDTH = USABLE_WIDTH_PX;

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
    .athena-page {
      background: white !important;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08), 0 2px 5px rgba(0,0,0,0.05) !important;
      margin: 32px auto !important;
      position: relative !important;
      box-sizing: border-box !important;
      transition: transform 0.2s ease, box-shadow 0.2s ease !important;
      border: none !important;  /* Removed grey border */
      border-radius: 2px !important;
      height: 1123px !important; /* A4 height at 96 DPI */
      display: flex !important;
      flex-direction: column !important;
    }
    .athena-page:hover {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12) !important;
    }
    .athena-page.is-blank {
      opacity: 0.7 !important;
    }
    .content-area {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      min-height: 0 !important; /* Allow content to fill available space */
    }
    .ProseMirror {
      background: transparent !important;
      padding: 0 !important;
      min-height: 100% !important;
      flex: 1 !important;
      display: block !important;
    }
    .editor-scroll-container {
      background-color: #f3f4f6 !important; /* Slightly darker gray to make pages pop */
      min-height: 100vh !important;
    }
    .document-container {
      padding: 40px 0 100px 0 !important;
      background-color: #f3f4f6 !important;
      min-height: 100% !important;
    }
    .ProseMirror h1, .prose .ProseMirror h1, .prose-lg .ProseMirror h1 { font-size: 2.5rem; font-weight: 800 !important; line-height: 1.15 !important; margin-top: 0.75rem !important; margin-bottom: 0.25rem !important; color: #1f2937 !important; display: block !important; font-family: Georgia, serif !important; }
    .ProseMirror h2, .prose .ProseMirror h2, .prose-lg .ProseMirror h2 { font-size: 2rem; font-weight: 700 !important; line-height: 1.15 !important; margin-top: 0.75rem !important; margin-bottom: 0.25rem !important; color: #1f2937 !important; display: block !important; font-family: Georgia, serif !important; }
    .ProseMirror h3, .prose .ProseMirror h3, .prose-lg .ProseMirror h3 { font-size: 1.75rem; font-weight: 600 !important; line-height: 1.15 !important; margin-top: 0.625rem !important; margin-bottom: 0.25rem !important; color: #1f2937 !important; display: block !important; font-family: Georgia, serif !important; }
    .ProseMirror h4, .prose .ProseMirror h4, .prose-lg .ProseMirror h4 { font-size: 1.5rem; font-weight: 600 !important; line-height: 1.15 !important; margin-top: 0.5rem !important; margin-bottom: 0.25rem !important; color: #1f2937 !important; display: block !important; font-family: Georgia, serif !important; }
    .ProseMirror h5, .prose .ProseMirror h5, .prose-lg .ProseMirror h5 { font-size: 1.25rem; font-weight: 600 !important; line-height: 1.15 !important; margin-top: 0.5rem !important; margin-bottom: 0.25rem !important; color: #1f2937 !important; display: block !important; font-family: Georgia, serif !important; }
    .ProseMirror h6, .prose .ProseMirror h6, .prose-lg .ProseMirror h6 { font-size: 1.1rem; font-weight: 600 !important; line-height: 1.15 !important; margin-top: 0.5rem !important; margin-bottom: 0.25rem !important; color: #1f2937 !important; display: block !important; font-family: Georgia, serif !important; }
    .ProseMirror p, .prose .ProseMirror p, .prose-lg .ProseMirror p { font-size: 1rem; line-height: 1.2 !important; margin-top: 0 !important; margin-bottom: 0 !important; color: #374151 !important; display: block !important; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; page-break-inside: auto !important; }
    .ProseMirror [data-type="heading"] { font-family: Georgia, serif !important; page-break-after: avoid !important; page-break-inside: avoid !important; }
  `;
  document.head.appendChild(style);
};