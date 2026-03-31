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

// Note: Don't re-export constants - import them directly from the source
// This file should only export utility functions

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

/**
 * Update heading styles via CSS custom properties.
 * This allows runtime customization without !important injection.
 * 
 * @param {Object} options - Custom heading style options
 * @param {string} [options.h1Size] - H1 font size (e.g., '2rem')
 * @param {string} [options.h1Weight] - H1 font weight (e.g., '700')
 * @param {string} [options.h2Size] - H2 font size
 * @param {string} [options.h2Weight] - H2 font weight
 * @param {string} [options.h3Size] - H3 font size
 * @param {string} [options.h3Weight] - H3 font weight
 * @param {string} [options.h4Size] - H4 font size
 * @param {string} [options.h4Weight] - H4 font weight
 * @param {string} [options.h5Size] - H5 font size
 * @param {string} [options.h5Weight] - H5 font weight
 * @param {string} [options.h6Size] - H6 font size
 * @param {string} [options.h6Weight] - H6 font weight
 * @param {string} [options.pSize] - Paragraph font size
 * @param {string} [options.headingFontFamily] - Heading font family
 * @param {string} [options.textFontFamily] - Text font family
 */
export const updateHeadingStyles = (options = {}) => {
  const root = document.documentElement;
  
  if (options.h1Size) root.style.setProperty('--editor-h1-size', options.h1Size);
  if (options.h1Weight) root.style.setProperty('--editor-h1-weight', options.h1Weight);
  if (options.h2Size) root.style.setProperty('--editor-h2-size', options.h2Size);
  if (options.h2Weight) root.style.setProperty('--editor-h2-weight', options.h2Weight);
  if (options.h3Size) root.style.setProperty('--editor-h3-size', options.h3Size);
  if (options.h3Weight) root.style.setProperty('--editor-h3-weight', options.h3Weight);
  if (options.h4Size) root.style.setProperty('--editor-h4-size', options.h4Size);
  if (options.h4Weight) root.style.setProperty('--editor-h4-weight', options.h4Weight);
  if (options.h5Size) root.style.setProperty('--editor-h5-size', options.h5Size);
  if (options.h5Weight) root.style.setProperty('--editor-h5-weight', options.h5Weight);
  if (options.h6Size) root.style.setProperty('--editor-h6-size', options.h6Size);
  if (options.h6Weight) root.style.setProperty('--editor-h6-weight', options.h6Weight);
  if (options.pSize) root.style.setProperty('--editor-p-size', options.pSize);
  if (options.headingFontFamily) root.style.setProperty('--editor-heading-font-family', options.headingFontFamily);
  if (options.textFontFamily) root.style.setProperty('--editor-text-font-family', options.textFontFamily);
};

/**
 * Legacy function - now a no-op for backward compatibility.
 * Styles are now in AthenaEditor.css using CSS custom properties.
 * Use updateHeadingStyles() instead for runtime customization.
 */
export const addHeadingStyles = () => {
  // No-op: styles are loaded via AthenaEditor.css
  // For runtime customization, use updateHeadingStyles(options)
};