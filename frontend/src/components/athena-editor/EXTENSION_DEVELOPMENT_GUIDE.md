# Athena Editor — Extension Development Guide

## Overview

This guide teaches you how to create custom TipTap extensions, hooks, utilities, and integrations for the Athena Editor. It covers best practices, patterns, and real examples from the codebase.

**Target Audience**: Developers extending or customizing the Athena Editor

**Prerequisites**:
- Basic knowledge of React and TipTap
- Understanding of ProseMirror concepts
- Familiarity with the Athena Editor architecture (see DOCUMENTATION.md)

---

## Table of Contents

1. [Extension Architecture](#1-extension-architecture)
2. [Creating Custom Nodes](#2-creating-custom-nodes)
3. [Creating Custom Marks](#3-creating-custom-marks)
4. [Creating Custom Extensions](#4-creating-custom-extensions)
5. [Node Views with React](#5-node-views-with-react)
6. [Custom Commands](#6-custom-commands)
7. [ProseMirror Plugins](#7-prosemirror-plugins)
8. [Editor Hooks](#8-editor-hooks)
9. [Utility Functions](#9-utility-functions)
10. [Testing Extensions](#10-testing-extensions)
11. [Performance Best Practices](#11-performance-best-practices)
12. [Common Patterns](#12-common-patterns)
13. [Debugging Tips](#13-debugging-tips)

---

## 1. Extension Architecture

### 1.1 TipTap Extension Types

**Node**: Block-level elements (paragraph, heading, image, table)
```javascript
import { Node } from '@tiptap/core';

export const CustomNode = Node.create({ ... });
```

**Mark**: Inline formatting (bold, italic, link, color)
```javascript
import { Mark } from '@tiptap/core';

export const CustomMark = Mark.create({ ... });
```

**Extension**: Behavior modifications (placeholder, focus, collaboration)
```javascript
import { Extension } from '@tiptap/core';

export const CustomExtension = Extension.create({ ... });
```

---

### 1.2 Extension Registration

**File**: `components/TextEditor.jsx`

```javascript
import { CustomNode } from '../extensions/CustomNode';

const editor = useEditor({
  extensions: [
    StarterKit,
    CustomNode.configure({ ... }),  // Register here
    // ... other extensions
  ],
});
```

---

## 2. Creating Custom Nodes

### 2.1 Basic Node Example

**File**: `extensions/CustomNode.js`

```javascript
import { Node, mergeAttributes } from '@tiptap/core';

export const CustomNode = Node.create({
  // ── Basic Configuration ────────────────────────────────────
  name: 'customNode',
  group: 'block',
  content: 'inline*',
  
  // ── Attributes ─────────────────────────────────────────────
  addAttributes() {
    return {
      customAttr: {
        default: 'default-value',
        parseHTML: element => element.getAttribute('data-custom'),
        renderHTML: attributes => ({
          'data-custom': attributes.customAttr,
        }),
      },
    };
  },
  
  // ── Parsing ────────────────────────────────────────────────
  parseHTML() {
    return [
      {
        tag: 'div[data-type="custom-node"]',
      },
    ];
  },
  
  // ── Rendering ──────────────────────────────────────────────
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 
      'data-type': 'custom-node',
      class: 'custom-node-class'
    }), 0];
  },
  
  // ── Commands ───────────────────────────────────────────────
  addCommands() {
    return {
      insertCustomNode: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    };
  },
  
  // ── Keyboard Shortcuts ─────────────────────────────────────
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-x': () => this.editor.commands.insertCustomNode(),
    };
  },
});
```

---

### 2.2 Page Node (Real Example)

**File**: `extensions/Page.js`

```javascript
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import PageComponent from '../components/PageView.jsx';

export const Page = Node.create({
  name: 'page',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      pageNumber: {
        default: 1,  // ✅ CRITICAL: Must have default
        parseHTML: el => parseInt(el.getAttribute('data-page-number') || '1', 10),
        renderHTML: attrs => ({ 'data-page-number': attrs.pageNumber }),
      },
      isBlank: {
        default: false,
        parseHTML: el => el.getAttribute('data-is-blank') === 'true',
        renderHTML: attrs => ({ 'data-is-blank': String(attrs.isBlank) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-page-number]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'page' }), 0];
  },

  // React Node View for interactive rendering
  addNodeView() {
    return ReactNodeViewRenderer(PageComponent);
  },
});
```

---

### 2.3 Node with Custom Schema

**Advanced Node**:
```javascript
import { Node } from '@tiptap/core';

export const AdvancedNode = Node.create({
  name: 'advancedNode',
  group: 'block',
  content: '(paragraph|heading|list)+',  // Specific content types
  isolating: true,  // Prevent Backspace from joining
  selectable: true,
  draggable: true,

  // Default content for new nodes
  addOptions() {
    return {
      HTMLAttributes: {},
      allowNestedPages: false,
    };
  },

  // Validation
  addStorage() {
    return {
      validationRules: [],
    };
  },
});
```

---

## 3. Creating Custom Marks

### 3.1 Basic Mark Example

**File**: `extensions/CustomMark.js`

```javascript
import { Mark, mergeAttributes } from '@tiptap/core';

export const CustomMark = Mark.create({
  name: 'customMark',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: element => element.style.color,
        renderHTML: attributes => {
          if (!attributes.color) return {};
          return { style: `color: ${attributes.color}` };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="color"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setCustomMark: (attributes) => ({ chain }) => {
        return chain()
          .setMark(this.name, attributes)
          .run();
      },
      toggleCustomMark: (attributes) => ({ chain }) => {
        return chain()
          .toggleMark(this.name, attributes)
          .run();
      },
      unsetCustomMark: () => ({ chain }) => {
        return chain()
          .unsetMark(this.name)
          .run();
      },
    };
  },
});
```

---

### 3.2 FontSize Mark (Real Example)

**File**: `extensions/FontSize.js`

```javascript
import { Extension } from '@tiptap/core';

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalStyle() {
    return [
      '.has-font-size { font-size: var(--font-size); }',
    ];
  },

  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: `${fontSize}px` })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});
```

---

## 4. Creating Custom Extensions

### 4.1 Basic Extension

```javascript
import { Extension } from '@tiptap/core';

export const CustomExtension = Extension.create({
  name: 'customExtension',

  addOptions() {
    return {
      enabled: true,
      customOption: 'default',
    };
  },

  // Lifecycle hooks
  onCreate() {
    console.log('Editor created');
  },

  onUpdate() {
    console.log('Content updated');
  },

  onSelectionUpdate() {
    console.log('Selection changed');
  },

  onTransaction() {
    console.log('Transaction dispatched');
  },

  onFocus() {
    console.log('Editor focused');
  },

  onBlur() {
    console.log('Editor blurred');
  },

  onDestroy() {
    console.log('Editor destroyed');
  },
});
```

---

### 4.2 TextDirection Extension (Real Example)

**File**: `extensions/TextDirection.js`

```javascript
import { Extension } from '@tiptap/core';

export const TextDirection = Extension.create({
  name: 'textDirection',

  addOptions() {
    return {
      types: ['heading', 'paragraph'],
      directions: ['ltr', 'rtl'],
    };
  },

  addGlobalStyle() {
    return [
      '[data-text-direction="rtl"] { direction: rtl; text-align: right; }',
      '[data-text-direction="ltr"] { direction: ltr; text-align: left; }',
    ];
  },

  addCommands() {
    return {
      setTextDirection: direction => ({ commands }) => {
        return this.options.types.every(type =>
          commands.updateAttributes(type, { textDirection: direction })
        );
      },
      unsetTextDirection: () => ({ commands }) => {
        return this.options.types.every(type =>
          commands.resetAttributes(type, 'textDirection')
        );
      },
    };
  },

  addAttributes() {
    return {
      textDirection: {
        default: null,
        parseHTML: element => element.getAttribute('data-text-direction'),
        renderHTML: attributes => {
          if (!attributes.textDirection) return {};
          return { 'data-text-direction': attributes.textDirection };
        },
      },
    };
  },
});
```

---

## 5. Node Views with React

### 5.1 Basic React Node View

**File**: `extensions/ResizableImage.jsx`

```javascript
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageComponent from '../components/ImageComponent.jsx';

export const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: { default: '100%' },
      height: { default: 'auto' },
      alignment: { default: 'left' },
    };
  },

  parseHTML() {
    return [{ tag: 'img' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  // React component for interactive rendering
  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },
});
```

---

### 5.2 React Node View Component

**File**: `components/ImageComponent.jsx`

```javascript
import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const ImageComponent = ({ node, updateAttributes, selected }) => {
  const [isResizing, setIsResizing] = useState(false);

  const handleResize = (event) => {
    const newWidth = event.target.offsetWidth;
    updateAttributes({ width: `${newWidth}px` });
  };

  return (
    <NodeViewWrapper className={`resizable-image ${selected ? 'selected' : ''}`}>
      <img
        src={node.attrs.src}
        alt={node.attrs.alt}
        style={{ width: node.attrs.width }}
        draggable={false}
      />
      
      {selected && (
        <div className="resize-handles">
          <div 
            className="resize-handle-right"
            onMouseDown={handleResize}
          />
        </div>
      )}
    </NodeViewWrapper>
  );
};

export default ImageComponent;
```

---

### 5.3 Node View Props

React node views receive these props:

```javascript
const NodeViewComponent = ({
  node,              // ProseMirror node
  updateAttributes,  // Function to update node attributes
  deleteNode,        // Function to delete the node
  selected,          // Boolean: is node selected?
  editor,            // TipTap editor instance
  getPos,            // Function to get node position
  setNodeSelection,  // Function to select this node
}) => {
  // Your component logic
};
```

---

## 6. Custom Commands

### 6.1 Basic Command

```javascript
// In your extension
addCommands() {
  return {
    // Simple command
    insertParagraph: () => ({ commands }) => {
      return commands.insertContent({
        type: 'paragraph',
        content: [{ type: 'text', text: 'New paragraph' }]
      });
    },

    // Command with parameters
    insertHeading: (level) => ({ commands }) => {
      return commands.insertContent({
        type: 'heading',
        attrs: { level },
        content: [{ type: 'text', text: 'New heading' }]
      });
    },

    // Complex command with validation
    safeInsert: (content) => ({ tr, dispatch }) => {
      if (!tr.selection) return false;
      
      if (dispatch) {
        tr.replaceSelectionWith(content);
      }
      return true;
    },
  };
}
```

---

### 6.2 Chainable Commands

```javascript
addCommands() {
  return {
    // Chain multiple operations
    insertAndFormat: (text) => ({ chain }) => {
      return chain()
        .insertContent(text)
        .toggleBold()
        .toggleHeading({ level: 2 })
        .run();
    },

    // Conditional chain
    conditionalFormat: () => ({ chain, state }) => {
      const { selection } = state;
      
      if (selection.empty) {
        return chain().toggleBold().run();
      }
      
      return chain().toggleItalic().run();
    },
  };
}
```

---

### 6.3 Using Commands

```javascript
// In your component
const MyComponent = ({ editor }) => {
  const handleInsert = () => {
    editor.commands.insertParagraph();
    editor.commands.insertHeading(1);
    editor.chain().focus().insertAndFormat('Hello').run();
  };

  return <button onClick={handleInsert}>Insert</button>;
};
```

---

## 7. ProseMirror Plugins

### 7.1 Basic Plugin

```javascript
import { Plugin, PluginKey } from 'prosemirror-state';

const PLUGIN_KEY = new PluginKey('myCustomPlugin');

export const customPlugin = () => {
  return new Plugin({
    key: PLUGIN_KEY,

    // Initial state
    state: {
      init() {
        return { count: 0 };
      },
      apply(tr, value) {
        return { count: value.count + 1 };
      },
    },

    // View methods
    view(view) {
      return {
        update(view, prevState) {
          console.log('View updated');
        },
        destroy() {
          console.log('Plugin destroyed');
        },
      };
    },

    // Event handlers
    props: {
      handleClick(view, pos, event) {
        console.log('Clicked at position:', pos);
        return false; // Let other handlers run
      },

      handleKeyDown(view, event) {
        if (event.key === 'Escape') {
          console.log('Escape pressed');
          return true; // Event handled
        }
        return false;
      },
    },
  });
};
```

---

### 7.2 Paste Pagination Plugin (Real Example)

**File**: `hooks/usePastePagination.js`

```javascript
import { Plugin, PluginKey } from 'prosemirror-state';
import { paginateDocument } from '../utils/paginationEngine';

const PLUGIN_KEY = new PluginKey('athenaPastePagination');

export function usePastePagination(editor, isPastingRef, lastPasteTimeRef) {
  useEffect(() => {
    if (!editor) return;

    const plugin = new Plugin({
      key: PLUGIN_KEY,

      props: {
        handlePaste(view, event, slice) {
          // Set flags
          isPastingRef.current = true;
          lastPasteTimeRef.current = Date.now();
          window.__athena_pasteInFlight = true;

          // Wait for DOM to settle
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (!editor.isDestroyed) {
                paginateDocument(editor, { force: true, reason: 'paste' });
              }
              isPastingRef.current = false;
              window.__athena_pasteInFlight = false;
            });
          });

          return false; // Let ProseMirror handle paste
        },
      },
    });

    // Register plugin
    const { view } = editor;
    view.updateState(
      view.state.reconfigure({
        plugins: [...view.state.plugins, plugin],
      })
    );

    // Cleanup
    return () => {
      if (editor.isDestroyed) return;
      const filtered = editor.view.state.plugins.filter(
        p => p.spec?.key !== PLUGIN_KEY
      );
      editor.view.updateState(
        editor.view.state.reconfigure({ plugins: filtered })
      );
    };
  }, [editor]);
}
```

---

### 7.3 Transaction Filtering (For Collaboration)

```javascript
import { Plugin } from 'prosemirror-state';

export const transactionFilter = () => {
  return new Plugin({
    filterTransaction(tr, state) {
      // Block pagination transactions from syncing
      if (tr.getMeta('athena-pagination')) {
        return false; // Don't sync this transaction
      }
      
      // Block other internal transactions
      if (tr.getMeta('ui-event')) {
        return false;
      }
      
      return true; // Sync normal transactions
    },
  });
};
```

---

## 8. Editor Hooks

### 8.1 useEditorState (Real Example)

**File**: `hooks/useEditorState.js`

```javascript
import { useState, useEffect } from 'react';
import { useEditorContext } from '../contexts/EditorContent';

export const useEditorState = (initialState = {}) => {
  const { state: contextState, actions } = useEditorContext();
  
  const [documentTitle, setDocumentTitle] = useState(
    initialState.documentTitle || contextState?.documentTitle || 'Untitled'
  );
  
  const [saveStatus, setSaveStatus] = useState('saved');
  const [zoom, setZoom] = useState(100);

  // Sync with context
  useEffect(() => {
    actions.setDocumentTitle(documentTitle);
  }, [documentTitle, actions]);

  return {
    documentTitle,
    setDocumentTitle,
    saveStatus,
    setSaveStatus,
    zoom,
    setZoom,
  };
};
```

---

### 8.2 useFormattingActions

**File**: `hooks/useFormattingActions.js`

```javascript
import { useCallback } from 'react';

export const useFormattingActions = (editor) => {
  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const setFontSize = useCallback((size) => {
    editor?.chain().focus().setFontSize(size).run();
  }, [editor]);

  return {
    toggleBold,
    toggleItalic,
    setFontSize,
  };
};
```

---

### 8.3 Creating Custom Hooks

```javascript
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing document auto-save
 */
export const useAutoSave = (editor, documentId, delay = 2000) => {
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);

  const saveDocument = useCallback(async () => {
    if (!editor || !documentId) return;

    setSaveStatus('saving');
    try {
      await api.put(`/api/text-editor/document/${documentId}`, {
        data: editor.getJSON(),
      });
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      setSaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  }, [editor, documentId]);

  useEffect(() => {
    if (!editor) return;

    const debouncedSave = debounce(saveDocument, delay);

    editor.on('update', debouncedSave);

    return () => {
      editor.off('update', debouncedSave);
    };
  }, [editor, saveDocument, delay]);

  return { saveStatus, lastSaved, saveDocument };
};
```

---

## 9. Utility Functions

### 9.1 Content Helpers

**File**: `utils/contentHelpers.js`

```javascript
/**
 * Get document statistics
 */
export function getContentStats(editor) {
  if (!editor) return { words: 0, characters: 0, paragraphs: 0 };

  const text = editor.state.doc.textContent;
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const paragraphs = editor.state.doc.childCount;

  return {
    words,
    characters: text.length,
    paragraphs,
    pages: Math.ceil(paragraphs / 10), // Estimate
  };
}

/**
 * Extract headings for document outline
 */
export function extractHeadings(editor) {
  const headings = [];
  
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({
        level: node.attrs.level,
        text: node.textContent,
        position: pos,
      });
    }
  });

  return headings;
}

/**
 * Get selected text
 */
export function getSelectedText(editor) {
  if (!editor || editor.state.selection.empty) return '';
  
  const { from, to } = editor.state.selection;
  return editor.state.doc.textBetween(from, to);
}
```

---

### 9.2 Pagination Helpers

**File**: `utils/paginationEngine.js`

```javascript
/**
 * Paginate entire document
 */
export function paginateDocument(editor, options = {}) {
  const { force = false, reason = 'manual' } = options;

  if (!editor || editor.isDestroyed) return;

  // Check if already paginating
  if (window.__athena_isPaginating && !force) return;
  window.__athena_isPaginating = true;

  try {
    const { state, dispatch } = editor.view;
    const doc = state.doc;

    // Bin blocks into pages
    const pages = binIntoPages(doc.content);

    // Create new document with pages
    const newContent = createPageNodes(pages);

    // Replace document content
    const tr = state.tr.replaceWith(0, doc.content.size, newContent);
    
    // Tag as pagination transaction (for collaboration filtering)
    tr.setMeta('athena-pagination', true);
    tr.setMeta('ui-event', true);

    dispatch(tr);
  } finally {
    window.__athena_isPaginating = false;
  }
}

/**
 * Debounced pagination
 */
let paginationTimer = null;
export function debouncePaginate(editor) {
  clearTimeout(paginationTimer);
  paginationTimer = setTimeout(() => {
    paginateDocument(editor);
  }, 500);
}
```

---

## 10. Testing Extensions

### 10.1 Unit Testing

```javascript
import { createEditor } from '@tiptap/core';
import { CustomNode } from '../extensions/CustomNode';

describe('CustomNode', () => {
  it('should create a node', () => {
    const editor = createEditor({
      extensions: [CustomNode],
    });

    editor.commands.insertCustomNode();
    
    const html = editor.getHTML();
    expect(html).toContain('data-type="custom-node"');
  });

  it('should support attributes', () => {
    const editor = createEditor({
      extensions: [CustomNode],
    });

    editor.commands.insertCustomNode({ customAttr: 'test' });
    
    const html = editor.getHTML();
    expect(html).toContain('data-custom="test"');
  });
});
```

---

### 10.2 Integration Testing

```javascript
describe('Pagination Engine', () => {
  it('should paginate content correctly', () => {
    const editor = createTestEditor();
    
    // Insert enough content to overflow one page
    insertManyParagraphs(editor, 50);
    
    // Trigger pagination
    paginateDocument(editor);
    
    // Verify page nodes exist
    const pages = getNodesByType(editor, 'page');
    expect(pages.length).toBeGreaterThan(1);
  });

  it('should not sync pagination transactions', () => {
    const editor = createTestEditor();
    
    // Listen for transactions
    const transactions = [];
    editor.on('transaction', ({ transaction }) => {
      transactions.push(transaction);
    });
    
    // Trigger pagination
    paginateDocument(editor);
    
    // Verify transaction is tagged
    const lastTr = transactions[transactions.length - 1];
    expect(lastTr.getMeta('athena-pagination')).toBe(true);
  });
});
```

---

## 11. Performance Best Practices

### 11.1 Avoid Common Pitfalls

❌ **DON'T**:
```javascript
// Heavy computation in onUpdate
onUpdate() {
  const html = this.editor.getHTML();  // Expensive!
  const json = this.editor.getJSON();  // Expensive!
  sendToServer(html);  // On every keystroke!
}
```

✅ **DO**:
```javascript
// Debounce expensive operations
let saveTimer = null;

onUpdate() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const html = this.editor.getHTML();
    sendToServer(html);
  }, 1000);
}
```

---

### 11.2 Conditional Logging

```javascript
// Remove logs in production
const log = process.env.NODE_ENV === 'development'
  ? (...args) => console.log(...args)
  : () => {};

// Usage
onUpdate() {
  log('Editor updated');  // Only in development
}
```

---

### 11.3 Efficient Transaction Handling

```javascript
// Batch multiple operations
editor.chain()
  .focus()
  .insertContent('Hello')
  .toggleBold()
  .setTextSelection(10)
  .run();  // Single transaction, not 3

// Instead of:
editor.commands.insertContent('Hello');  // Transaction 1
editor.commands.toggleBold();            // Transaction 2
editor.commands.setTextSelection(10);    // Transaction 3
```

---

## 12. Common Patterns

### 12.1 Singleton Pattern

```javascript
class PaginationEngine {
  static instance = null;

  static getInstance() {
    if (!PaginationEngine.instance) {
      PaginationEngine.instance = new PaginationEngine();
    }
    return PaginationEngine.instance;
  }

  constructor() {
    if (PaginationEngine.instance) {
      throw new Error('Use getInstance()');
    }
  }
}

export const paginationEngine = PaginationEngine.getInstance();
```

---

### 12.2 Observer Pattern

```javascript
class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

export const editorEvents = new EventEmitter();
```

---

### 12.3 Factory Pattern

```javascript
export function createEditor(config) {
  const defaultConfig = {
    extensions: [],
    content: '',
    editable: true,
  };

  return useEditor({
    ...defaultConfig,
    ...config,
    extensions: [
      ...defaultExtensions,
      ...config.extensions,
    ],
  });
}
```

---

## 13. Debugging Tips

### 13.1 ProseMirror DevTools

Install: `@tiptap/dev`

```javascript
import { Editor } from '@tiptap/react';
import { DevTools } from '@tiptap/dev';

const editor = new Editor({ ... });

// In browser console
window.editor = editor;

// Inspect document structure
console.log(editor.state.doc.toJSON());
```

---

### 13.2 Transaction Logging

```javascript
editor.on('transaction', ({ transaction }) => {
  console.log('Transaction:', {
    steps: transaction.steps.length,
    selection: transaction.selection,
    meta: transaction.getMeta(),
    isPagination: transaction.getMeta('athena-pagination'),
  });
});
```

---

### 13.3 Performance Profiling

```javascript
// Measure pagination performance
const start = performance.now();
paginateDocument(editor);
const end = performance.now();

console.log(`Pagination took: ${end - start}ms`);
```

---

### 13.4 Common Errors

**Error**: "Cannot read property 'type' of undefined"
- **Cause**: Node schema not registered
- **Fix**: Add extension to `useEditor({ extensions: [...] })`

**Error**: "Node view not rendering"
- **Cause**: Missing `addNodeView()` method
- **Fix**: Add `return ReactNodeViewRenderer(Component)`

**Error**: "Transaction not dispatching"
- **Cause**: Transaction filtered out
- **Fix**: Check `filterTransaction` in plugins

---

## Appendix A: Extension Checklist

Before publishing an extension:

- [ ] Name is unique and descriptive
- [ ] Schema is properly defined
- [ ] Attributes have defaults
- [ ] parseHTML and renderHTML match
- [ ] Commands are implemented
- [ ] Keyboard shortcuts added
- [ ] TypeScript types (if applicable)
- [ ] Unit tests written
- [ ] Performance tested
- [ ] Documentation complete

---

## Appendix B: Resources

- **TipTap Docs**: https://tiptap.dev/docs
- **ProseMirror Guide**: https://prosemirror.net/docs/guide/
- **Athena Editor Docs**: See DOCUMENTATION.md
- **Sync Architecture**: See SYNC_RESEARCH_AND_VALIDATION.md

---

**Last Updated**: April 17, 2026  
**TipTap Version**: 3.17.1  
**React Version**: 19.1.1
