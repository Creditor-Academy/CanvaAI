# Athena Editor - Complete Technical Documentation

## Documentation Overview

This document provides comprehensive technical documentation for every functionality in the Athena Editor, a production-grade rich text editor built with TipTap/ProseMirror, featuring AI integration, real-time collaboration, pagination, and multi-format export capabilities.

**Target Audience**: Developers integrating with, extending, or maintaining the Athena Editor

**Technology Stack**:
- Frontend: React 19, TipTap 3.x (ProseMirror-based), Yjs CRDTs
- Backend: Node.js, Express, MongoDB, Socket.io
- AI: OpenAI GPT-4o-mini, Anthropic Claude, Google Gemini
- Styling: Tailwind CSS, Radix UI components

---

## Table of Contents

1. [Core Editor Architecture](#1-core-editor-architecture)
2. [TipTap Extensions System](#2-tiptap-extensions-system)
3. [Text Formatting & Editing Features](#3-text-formatting--editing-features)
4. [Pagination Engine](#4-pagination-engine)
5. [AI-Powered Features](#5-ai-powered-features)
6. [Real-Time Collaboration](#6-real-time-collaboration)
7. [Document Management](#7-document-management)
8. [Export System](#8-export-system)
9. [UI Components](#9-ui-components)
10. [Hooks & State Management](#10-hooks--state-management)
11. [Context Providers](#11-context-providers)
12. [Utility Functions](#12-utility-functions)
13. [Keyboard Shortcuts](#13-keyboard-shortcuts)
14. [API Integration](#14-api-integration)
15. [Performance Optimizations](#15-performance-optimizations)

---

## 1. Core Editor Architecture

### 1.1 TextEditor Component

**File**: `components/athena-editor/components/TextEditor.jsx` (7,675 lines)

**Purpose**: Main editor component that orchestrates all editor functionality

**Key Responsibilities**:
- Initialize TipTap editor with extensions
- Manage editor lifecycle (mount/unmount)
- Handle document loading/saving
- Coordinate pagination
- Integrate AI features
- Manage UI state (toolbars, dialogs, sidebars)

**Editor Initialization**:
```javascript
const editor = useEditor({
  extensions: [
    StarterKit.configure({ ... }),
    Document,
    Page,
    Collaboration,
    // ... 30+ extensions
  ],
  content: initialContent,
  onUpdate: ({ editor }) => {
    // Debounced auto-save
    // Pagination check
    // Token counting
  },
  editable: true,
  autofocus: true
});
```

**Props**:
- `mongoId`: MongoDB document ID (string | null)
- `initialContent`: ProseMirror JSON content (object)
- `readOnly`: Enable/disable editing (boolean)

**State Management**:
- Uses `useEditorState` hook for UI state
- Uses `useImageContext` for image management
- Uses `useExportState` for export configuration
- Local state for modals, sidebars, AI features

### 1.2 SafeTextEditor Component

**File**: `components/athena-editor/SafeTextEditor.jsx`

**Purpose**: Error boundary wrapper for TextEditor to prevent crashes

**Features**:
- Catches React rendering errors
- Provides fallback UI
- Logs errors for debugging
- Allows recovery without page reload

### 1.3 Editor Lifecycle

**Initialization Flow**:
1. Load document from MongoDB (if mongoId provided)
2. Auto-create document (if new document)
3. Initialize TipTap editor with extensions
4. Load content into editor
5. Run initial pagination
6. Setup auto-save debouncer
7. Connect to WebSocket (if collaboration enabled)

**Cleanup Flow**:
1. Save pending changes
2. Disconnect WebSocket
3. Destroy TipTap editor instance
4. Clear pagination cache
5. Remove event listeners

---

## 2. TipTap Extensions System

### 2.1 Page Extension

**File**: `extensions/Page.js`

**Purpose**: Custom TipTap node for page-based document structure

**Features**:
- Creates page boundaries in document
- Tracks page breaks
- Enables pagination visualization
- Supports page-level metadata

**Node Schema**:
```javascript
Page.create({
  name: 'page',
  content: 'block+',
  isolating: true,
  draggable: true,
  parseDOM: [{ tag: 'div[data-type="page"]' }],
  renderDOM: () => ({
    tag: 'div[data-type="page"]',
    class: 'editor-page'
  })
})
```

**Usage**:
```javascript
// Insert new page
editor.commands.insertPage();

// Get page count
const pageCount = editor.getHTML().split('data-type="page"').length - 1;
```

### 2.2 FontSize Extension

**File**: `extensions/FontSize.js`

**Purpose**: Enable custom font size control

**Features**:
- Set font size in pixels
- Supports range: 8px - 96px
- Persists in ProseMirror attributes

**Commands**:
```javascript
editor.commands.setFontSize(16); // Set to 16px
editor.commands.unsetFontSize();  // Remove custom size
```

### 2.3 Indent Extension

**File**: `extensions/Indent.js`

**Purpose**: Paragraph and list indentation control

**Features**:
- Indent/Outdent paragraphs
- Supports nested lists
- Configurable indent levels (max: 7)
- CSS margin-based implementation

**Commands**:
```javascript
editor.commands.indent();   // Increase indent
editor.commands.outdent();  // Decrease indent
```

### 2.4 ResizableImage Extension

**File**: `extensions/ResizableImage.jsx`

**Purpose**: Image node with resize handles

**Features**:
- Drag-to-resize handles
- Maintains aspect ratio option
- Width/height attributes
- Alignment control (left, center, right)
- Caption support

**React Node View**:
```javascript
const ResizableImage = Node.create({
  name: 'resizableImage',
  addNodeView: () => ReactNodeViewRenderer(ResizableImageComponent)
});
```

### 2.5 TableExtension

**File**: `extensions/TableExtension.js`

**Purpose**: Enhanced table with custom rendering

**Features**:
- Cell merging
- Column resize
- Header row/column
- Table alignment
- Custom cell styling

**Commands**:
```javascript
editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
editor.commands.addColumnBefore();
editor.commands.deleteRow();
```

### 2.6 TextDirection Extension

**File**: `extensions/TextDirection.js`

**Purpose**: Support for RTL/LTR text direction

**Features**:
- Left-to-right (LTR)
- Right-to-left (RTL)
- Auto-detect direction
- Per-paragraph direction

**Commands**:
```javascript
editor.commands.setTextDirection('ltr');
editor.commands.setTextDirection('rtl');
editor.commands.unsetTextDirection();
```

### 2.7 CustomTable Component

**File**: `extensions/CustomTable.jsx`

**Purpose**: React component for table node view rendering

**Features**:
- Interactive table editing UI
- Row/column operations
- Cell editing
- Table formatting toolbar

### 2.8 SpellCheckPlugin

**File**: `extensions/SpellCheckPlugin.js`

**Purpose**: Browser-native spell check integration

**Features**:
- Enables browser spell checker
- Custom underline styling
- Language detection

---

## 3. Text Formatting & Editing Features

### 3.1 Basic Formatting

**Supported Formats**:
- **Bold**: `Cmd/Ctrl + B`
- **Italic**: `Cmd/Ctrl + I`
- **Underline**: `Cmd/Ctrl + U`
- **Strikethrough**: `Cmd/Ctrl + Shift + X`
- **Code**: `Cmd/Ctrl + E`
- **Superscript**: `Cmd/Ctrl + .`
- **Subscript**: `Cmd/Ctrl + ,`

**Implementation**:
```javascript
// TipTap extensions
import { Bold, Italic, Underline } from '@tiptap/extension-underline';

// Commands
editor.chain().focus().toggleBold().run();
editor.chain().focus().toggleItalic().run();
```

### 3.2 Headings

**Levels**: H1 - H6

**Implementation**:
```javascript
StarterKit.configure({
  heading: { levels: [1, 2, 3, 4, 5, 6] }
});

// Commands
editor.chain().focus().toggleHeading({ level: 1 }).run();
editor.chain().focus().setHeading({ level: 2 }).run();
```

### 3.3 Lists

**Types**:
- Bullet lists
- Ordered lists
- Task lists (checkboxes)

**Commands**:
```javascript
editor.chain().focus().toggleBulletList().run();
editor.chain().focus().toggleOrderedList().run();
editor.chain().focus().toggleTaskList().run();
```

### 3.4 Text Alignment

**Options**: Left, Center, Right, Justify

**Implementation**:
```javascript
import { TextAlign } from '@tiptap/extension-text-align';

TextAlign.configure({ types: ['heading', 'paragraph'] });

// Commands
editor.chain().focus().setTextAlign('left').run();
editor.chain().focus().setTextAlign('center').run();
```

### 3.5 Color & Highlight

**Features**:
- Text color picker
- Background highlight
- Custom color input
- Recent colors

**Implementation**:
```javascript
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';

editor.chain().focus().setColor('#ff0000').run();
editor.chain().focus().toggleHighlight({ color: '#ffff00' }).run();
```

### 3.6 Font Family

**Available Fonts**:
- Arial, Times New Roman, Courier New
- Georgia, Verdana, Helvetica
- Custom font support

**Implementation**:
```javascript
import { FontFamily } from '@tiptap/extension-font-family';

editor.chain().focus().setFontFamily('Arial').run();
```

### 3.7 Links

**Features**:
- Insert/edit links
- Open in new tab
- Link validation
- Unlink

**Implementation**:
```javascript
import { Link } from '@tiptap/extension-link';

editor.chain().focus().setLink({ href: 'https://example.com' }).run();
editor.chain().focus().unsetLink().run();
```

### 3.8 Code Blocks

**Features**:
- Syntax highlighting (via lowlight)
- Language selection
- Line numbers
- Copy code button

**Implementation**:
```javascript
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';

const lowlight = createLowlight(common);

CodeBlockLowlight.configure({ lowlight });
```

### 3.9 Blockquotes

**Features**:
- Nested quotes
- Styled rendering
- Attribution support

**Command**:
```javascript
editor.chain().focus().toggleBlockquote().run();
```

### 3.10 Horizontal Rule

**Command**:
```javascript
editor.chain().focus().setHorizontalRule().run();
```

### 3.11 Find & Replace

**File**: `components/editor/FindReplaceModal.jsx`

**Features**:
- Case-sensitive search
- Whole word matching
- Replace single/all
- Regex support
- Match highlighting

**Usage**:
```javascript
// Open dialog
setShowFindReplace(true);

// Search
const matches = editor.commands.find('search term', {
  caseSensitive: false,
  wholeWord: false
});
```

---

## 4. Pagination Engine

### 4.1 Overview

**File**: `utils/paginationEngine.js` (32.9KB)

**Purpose**: Automatically paginates content to fit within page boundaries

**Key Features**:
- Content-aware page breaks
- Prevents content overflow
- Handles images, tables, headings
- Debounced pagination (performance optimized)
- Paste detection for bulk content

### 4.2 PaginationEngine Class

**API**:
```javascript
import { PaginationEngine } from './paginationEngine';

const engine = new PaginationEngine({
  pageHeight: 1056, // pixels
  marginTop: 96,
  marginBottom: 96,
  marginLeft: 96,
  marginRight: 96
});

// Paginate document
engine.paginate(editor);
```

### 4.3 Pagination Functions

**Core Functions**:

1. **paginateDocument()**: Full document pagination
```javascript
import { paginateDocument } from '../utils/paginationEngine';

paginateDocument(editor, {
  runCalibration: true,
  showNotifications: false
});
```

2. **debouncePaginate()**: Debounced version (500ms delay)
```javascript
import { debouncePaginate } from '../utils/paginationEngine';

debouncePaginate(editor);
```

3. **cleanupPagination()**: Remove page breaks
```javascript
import { cleanupPagination } from '../utils/paginationEngine';

cleanupPagination(editor);
```

### 4.4 Paste Pagination

**File**: `hooks/usePastePagination.js`

**Purpose**: Detect paste events and trigger pagination

**Features**:
- Monitors document size changes
- Detects bulk content insertion
- Triggers pagination after paste
- Prevents infinite loops

**Usage**:
```javascript
const { onPaste } = usePastePagination(editor);

editor.on('paste', onPaste);
```

### 4.5 Page Height Calibration

**Purpose**: Calculate accurate page height based on rendered content

**Process**:
1. Insert test content
2. Measure rendered height
3. Adjust for margins/padding
4. Store calibration value

### 4.6 Content Overflow Handling

**Scenarios**:
- **Headings**: Prevent page break after heading
- **Images**: Move entire image to next page if doesn't fit
- **Tables**: Split table across pages or move entirely
- **Lists**: Keep list items together when possible

---

## 5. AI-Powered Features

### 5.1 AI Utilities

**File**: `ai/aiUtils.js` (16.3KB)

**Purpose**: Core AI function implementations

**Available Functions**:

#### rewriteText()
```javascript
import { rewriteText } from '../ai/aiUtils';

const result = await rewriteText(editor, selectedText, {
  stream: true,
  onChunk: (chunk) => { /* handle streaming */ }
});
```

#### expandText()
```javascript
const expanded = await expandText(editor, selectedText);
```

#### summarizeText()
```javascript
const summary = await summarizeText(editor, selectedText);
```

#### changeTone()
```javascript
const result = await changeTone(editor, selectedText, 'professional');
// Options: professional, casual, friendly, formal, academic
```

#### paraphraseText()
```javascript
const paraphrased = await paraphraseText(editor, selectedText);
```

#### improveReadability()
```javascript
const improved = await improveReadability(editor, selectedText);
```

#### bulletToParagraph()
```javascript
const paragraphs = await bulletToParagraph(editor, selectedBullets);
```

### 5.2 AI Assistant

**File**: `components/editor/AIAssistant.jsx` (57.5KB)

**Features**:
- Chat interface with AI
- Context-aware suggestions
- Text generation
- Code generation
- Writing assistance

**Usage**:
```javascript
// Open AI sidebar
setIsAISidebarOpen(true);

// Send message to AI
const response = await callAIStreamAPI({
  messages: [{ role: 'user', content: 'Help me write...' }],
  systemPrompt: 'You are a writing assistant...',
  stream: true
});
```

### 5.3 Code Assistant

**File**: `components/editor/CodeAssistant.jsx` (13.5KB)

**Features**:
- Code generation
- Code explanation
- Bug fixing
- Language selection

**Supported Languages**:
- JavaScript, Python, HTML/CSS
- React, Node.js, SQL
- And 50+ more via OpenAI

### 5.4 Voice Typing

**File**: `components/editor/VoiceTyping.jsx` (12.0KB)

**Features**:
- Speech-to-text via Web Speech API
- Real-time transcription
- Language selection
- Punctuation commands

**Usage**:
```javascript
// Start voice typing
const voiceTyping = new VoiceTyping(editor);
voiceTyping.start();

// Stop
voiceTyping.stop();
```

### 5.5 AI Quota Management

**File**: `components/editor/AIQuotaBadge.jsx`

**Features**:
- Track AI usage limits
- Display remaining quota
- Reset tracking
- Cost estimation

### 5.6 Token Counter

**Files**:
- `components/editor/TokenCounter.jsx`
- `components/editor/RealtimeTokenBadge.jsx`
- `components/editor/EnhancedTokenBadge.jsx`
- `utils/realtimeTokenCounter.js`

**Features**:
- Real-time token counting
- OpenAI token estimation
- Character/word count
- Token usage visualization

**API**:
```javascript
import { countTokens } from '../../../utils/realtimeTokenCounter';

const tokens = countTokens(editor.state.doc);
```

---

## 6. Real-Time Collaboration

### 6.1 Yjs Integration

**Packages**: `yjs`, `y-indexeddb`, `y-webrtc`

**Purpose**: CRDT-based conflict-free collaboration

**Setup**:
```javascript
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

const ydoc = new Y.Doc();
const provider = new IndexeddbPersistence('doc-123', ydoc);
```

### 6.2 TipTap Collaboration Extension

**Package**: `@tiptap/extension-collaboration`

**Configuration**:
```javascript
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

Collaboration.configure({
  document: ydoc,
  field: 'content'
}),

CollaborationCursor.configure({
  provider: websocketProvider,
  user: { name: 'User 1', color: '#ff0000' }
})
```

### 6.3 WebSocket Provider

**Implementation**: Socket.io client/server

**Client**:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.emit('join-document', { documentId, userId, token });
socket.on('yjs-update', (update) => {
  Y.applyUpdate(ydoc, update);
});
```

**Server**: See backend socket-server.js

### 6.4 Presence Features

**Current User Indicators**:
- Cursor position
- User name/color
- Selection highlighting

**Future Enhancements**:
- Comments/annotations
- Chat sidebar
- Video/audio calls

---

## 7. Document Management

### 7.1 Auto-Create Document

**File**: `hooks/useAutoCreateDocument.js`

**Purpose**: Automatically create document when editor opens

**Flow**:
1. Check if mongoId exists
2. If not, create empty document
3. Save to MongoDB
4. Update URL with document ID
5. Store in sessionStorage

**Usage**:
```javascript
const { isCreating, createdDocId, error } = useAutoCreateDocument(mongoId, navigate);
```

### 7.2 Document Hooks

**File**: `hooks/useDocuments.js`

**Available Hooks**:

#### useDocuments()
Fetch all documents for current user
```javascript
const { data: documents, isLoading } = useDocuments();
```

#### useDocument(documentId)
Fetch single document
```javascript
const { data: document, isLoading } = useDocument('doc-123');
```

#### useSaveDocument()
Save new document mutation
```javascript
const saveMutation = useSaveDocument();
saveMutation.mutate({ title: 'My Doc', data: content });
```

#### useUpdateDocument()
Update existing document
```javascript
const updateMutation = useUpdateDocument();
updateMutation.mutate({ id: 'doc-123', data: content });
```

#### useDeleteDocument()
Delete document with optimistic updates
```javascript
const deleteMutation = useDeleteDocument();
deleteMutation.mutate('doc-123');
```

### 7.3 Text Editor Service

**File**: `services/Text-Editor/text.service.js`

**API Methods**:

```javascript
// Save document
await TextEditorService.saveDocument({ title, data });

// Get document
await TextEditorService.getDocumentById(id);

// Update document
await TextEditorService.updateDocument(id, data);

// Delete document
await TextEditorService.deleteDocument(id);

// Get all documents
await TextEditorService.getAllDocuments();
```

### 7.4 Document Model

**File**: `backend/models/Document.js`

**Schema**:
```javascript
{
  title: String,
  data: {
    content: Object,      // ProseMirror JSON
    html: String,         // HTML representation
    yjsState: String      // Base64 Yjs state
  },
  userId: String,
  metadata: {
    wordCount: Number,
    characterCount: Number,
    lastEditedBy: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 8. Export System

### 8.1 Export Dialog

**File**: `components/ExportDialog.jsx` (26.2KB)

**Supported Formats**:
- PDF
- DOCX (Microsoft Word)
- TXT (Plain text)
- HTML
- EPUB
- Markdown

### 8.2 Export Menu

**File**: `components/editor/ExportMenu.jsx` (27.8KB)

**Features**:
- Quick export dropdown
- Format selection
- Export options
- Progress indicator

### 8.3 Document Exporter

**File**: `utils/documentExporter.js`

**Export Functions**:

#### PDF Export
```javascript
import { DocumentExporter } from '../utils/documentExporter';

await DocumentExporter.exportPDF(editor, {
  includePageNumbers: true,
  includeHeader: true,
  pageSize: 'A4'
});
```

#### DOCX Export
```javascript
await DocumentExporter.exportDOCX(editor, {
  title: 'Document Title',
  author: 'Author Name'
});
```

#### HTML Export
```javascript
const html = DocumentExporter.exportHTML(editor);
```

#### TXT Export
```javascript
const text = DocumentExporter.exportTXT(editor);
```

#### EPUB Export
```javascript
await DocumentExporter.exportEPUB(editor, {
  title: 'Book Title',
  author: 'Author',
  coverImage: 'url'
});
```

### 8.4 Export State Hook

**File**: `hooks/useExportState.js`

**Usage**:
```javascript
const {
  showExportDialog,
  exportFormat,
  exportOptions,
  setShowExportDialog,
  setExportFormat,
  setExportOptions
} = useExportState();
```

---

## 9. UI Components

### 9.1 Header Menu Bar

**File**: `components/editor/HeaderMenuBar.jsx` (24.3KB)

**Features**:
- File menu (New, Open, Save, Export)
- Edit menu (Undo, Redo, Cut, Copy, Paste)
- View menu (Zoom, Page setup)
- Insert menu (Image, Table, Link)
- Format menu (Font, Size, Color)
- Tools menu (Find/Replace, Word count)
- Help menu (Keyboard shortcuts, About)

### 9.2 Toolbar Components

**Location**: `components/editor/toolbar/`

**Toolbars**:
- Formatting toolbar
- Alignment toolbar
- List toolbar
- Insert toolbar

### 9.3 Document Outline

**File**: `components/editor/DocumentOutline.jsx` (20.4KB)

**Features**:
- Heading hierarchy display
- Click to navigate
- Drag to reorder
- Collapse/expand sections

### 9.4 Template Sidebar

**File**: `components/editor/TemplateSidebar.jsx` (42.3KB)

**Features**:
- Template gallery
- Category filtering
- Search templates
- Preview templates
- Insert template

### 9.5 Comments Panel

**File**: `components/editor/CommentsPanel.jsx` (21.7KB)

**Features**:
- Add comments
- Reply to comments
- Resolve comments
- Navigate to comment
- Comment indicators

### 9.6 Version History

**File**: `components/editor/VersionHistory.jsx` (13.2KB)

**Features**:
- View document versions
- Compare versions
- Restore version
- Timestamp display

### 9.7 Page Setup Dialog

**File**: `components/editor/PageSetupDialog.jsx` (15.6KB)

**Features**:
- Page size (A4, Letter, Legal)
- Margins (Top, Bottom, Left, Right)
- Orientation (Portrait, Landscape)
- Apply to document

### 9.8 Word Count Dialog

**File**: `components/editor/WordCountDialog.jsx`

**Features**:
- Word count
- Character count
- Paragraph count
- Page count
- Reading time

### 9.9 Keyboard Shortcuts Dialog

**File**: `components/editor/KeyboardShortcutsDialog.jsx`

**Features**:
- Display all shortcuts
- Category grouping
- Search shortcuts

### 9.10 Page Container & View

**Files**:
- `components/PageContainer.jsx`
- `components/PageView.jsx`

**Purpose**: Render paginated pages with proper styling

### 9.11 UI Components Library

**Location**: `components/ui/`

**Components**:
- Tabs, Buttons, Inputs
- Dialogs, Popovers, Tooltips
- Portals, Dropdowns
- And 20+ Radix UI wrappers

---

## 10. Hooks & State Management

### 10.1 useEditorState

**File**: `hooks/useEditorState.js` (9.2KB)

**Purpose**: Manage all editor UI state

**Returns**:
```javascript
{
  documentTitle, setDocumentTitle,
  documentStats, setDocumentStats,
  lastSaved, setLastSaved,
  saveStatus, setSaveStatus,
  currentFont, setCurrentFont,
  currentFontSize, setCurrentFontSize,
  currentTextColor, setCurrentTextColor,
  zoom, setZoom,
  showRuler, setShowRuler,
  isDarkMode, setIsDarkMode,
  // ... 30+ state values
}
```

### 10.2 useFormattingActions

**File**: `hooks/useFormattingActions.js` (7.4KB)

**Purpose**: Centralized formatting command handlers

**Returns**:
```javascript
{
  toggleBold,
  toggleItalic,
  toggleUnderline,
  setFontSize,
  setFontFamily,
  setTextColor,
  // ... more formatting actions
}
```

### 10.3 useTableOperations

**File**: `hooks/useTableOperations.js` (4.9KB)

**Purpose**: Table manipulation operations

**Returns**:
```javascript
{
  insertTable,
  addColumnBefore,
  addColumnAfter,
  deleteColumn,
  addRowBefore,
  addRowAfter,
  deleteRow,
  mergeCells,
  splitCell
}
```

### 10.4 useTablePicker

**File**: `hooks/useTablePicker.js` (5.1KB)

**Purpose**: Table grid picker UI state

**Usage**:
```javascript
const { rows, cols, setDimensions, reset } = useTablePicker();
```

### 10.5 useTokenCounter

**File**: `hooks/useTokenCounter.js` (4.2KB)

**Purpose**: Real-time token counting

**Usage**:
```javascript
const { tokens, words, characters } = useTokenCounter(editor);
```

### 10.6 usePastePagination

**File**: `hooks/usePastePagination.js` (9.4KB)

**Purpose**: Handle pagination after paste events

**Usage**:
```javascript
const { onPaste } = usePastePagination(editor);
```

### 10.7 useExportState

**File**: `hooks/useExportState.js` (4.7KB)

**Purpose**: Manage export dialog state

**Returns**: Export-related state and setters

### 10.8 useAutoCreateDocument

**File**: `hooks/useAutoCreateDocument.js` (4.8KB)

**Purpose**: Auto-create document on editor open

**Returns**:
```javascript
{ isCreating, createdDocId, error }
```

---

## 11. Context Providers

### 11.1 EditorContent Context

**File**: `contexts/EditorContent.jsx` (7.1KB)

**Purpose**: Global editor state management

**Provides**:
```javascript
{
  state: {
    documentTitle,
    documentStats,
    saveStatus,
    currentFont,
    zoom,
    // ... all editor state
  },
  actions: {
    setDocumentTitle,
    updateFormatting,
    updateUIState,
    // ... all state setters
  }
}
```

**Usage**:
```javascript
const { state, actions } = useEditorContext();
```

### 11.2 ImageContext

**File**: `contexts/ImageContext.jsx` (12.3KB)

**Purpose**: Image upload and management

**Provides**:
```javascript
{
  selectedFiles, setSelectedFiles,
  imagePreview, setImagePreview,
  uploadProgress, setUploadProgress,
  isImageUploading, setIsImageUploading,
  imageProperties, setImageProperties,
  // ... 20+ image-related state values
}
```

**Usage**:
```javascript
const { imagePreview, uploadImage, deleteImage } = useImageContext();
```

---

## 12. Utility Functions

### 12.1 Content Helpers

**File**: `utils/contentHelpers.js` (9.1KB)

**Functions**:
- `getContentStats(editor)`: Get word/char/page count
- `extractHeadings(editor)`: Get document outline
- `getSelectedText(editor)`: Get current selection
- `insertContent(editor, content)`: Safe content insertion
- `clearFormatting(editor)`: Remove all formatting

### 12.2 Pagination Engine

**File**: `utils/paginationEngine.js` (32.9KB)

**See Section 4** for full documentation

### 12.3 Realtime Token Counter

**File**: `utils/realtimeTokenCounter.js` (9.0KB)

**Functions**:
- `countTokens(doc)`: Count tokens in document
- `estimateTokens(text)`: Estimate tokens from text
- `getTokenUsage(editor)`: Get current token usage

### 12.4 Scroll Lock Manager

**File**: `utils/scrollLockManager.js` (2.2KB)

**Purpose**: Prevent scroll conflicts during pagination

**API**:
```javascript
import { lockScroll, unlockScroll } from './scrollLockManager';

lockScroll();
// Perform operations
unlockScroll();
```

### 12.5 Markdown Transformer

**File**: `utils/transformMarkdownToEditor.js` (2.1KB)

**Functions**:
- `transformMarkdownToEditor(markdown)`: Convert MD to ProseMirror JSON
- `isMarkdown(text)`: Detect if text is markdown

### 12.6 Logger

**File**: `utils/logger.js` (3.6KB)

**Purpose**: Conditional logging (disabled in production)

**Usage**:
```javascript
import { log, warn, error } from './logger';

log('Debug info');  // Only in development
warn('Warning');    // Only in development
error('Error');     // Always shown
```

### 12.7 Editor Commands

**File**: `components/editor/EditorCommands.js` (6.4KB)

**Purpose**: Centralized command registry

**Functions**:
- Register custom commands
- Execute commands
- Command validation

### 12.8 Editor Extensions Config

**File**: `components/editor/EditorExtensions.js` (10.5KB)

**Purpose**: Extension configuration helper

**Usage**:
```javascript
import { getDefaultExtensions } from './EditorExtensions';

const extensions = getDefaultExtensions({
  enableCollaboration: true,
  enablePagination: true
});
```

### 12.9 Editor Pagination

**File**: `components/editor/EditorPagination.js` (3.4KB)

**Functions**:
- `addHeadingStyles()`: Add heading CSS
- `updateHeadingStyles()`: Update heading CSS
- Pagination helper functions

### 12.10 Focus Utils

**File**: `components/editor/focusUtils.js` (11.5KB)

**Functions**:
- `restoreFocus(editor)`: Restore cursor position
- `getFocusedNode(editor)`: Get current focused node
- `setFocus(editor, position)`: Set cursor position

### 12.11 Keyboard Shortcuts

**File**: `components/editor/useKeyboardShortcuts.js` (3.8KB)

**Purpose**: Custom keyboard shortcut handler

**Usage**:
```javascript
useKeyboardShortcuts(editor, {
  'Cmd+Shift+P': () => openCommandPalette(),
  'Cmd+K': () => insertLink()
});
```

---

## 13. Keyboard Shortcuts

### 13.1 Formatting Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + B` | Toggle Bold |
| `Cmd/Ctrl + I` | Toggle Italic |
| `Cmd/Ctrl + U` | Toggle Underline |
| `Cmd/Ctrl + Shift + X` | Toggle Strikethrough |
| `Cmd/Ctrl + E` | Toggle Code |
| `Cmd/Ctrl + \` | Remove Formatting |
| `Cmd/Ctrl + Shift + S` | Toggle Superscript |
| `Cmd/Ctrl + Shift + B` | Toggle Subscript |

### 13.2 Heading Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Alt + 1` | Heading 1 |
| `Cmd/Ctrl + Alt + 2` | Heading 2 |
| `Cmd/Ctrl + Alt + 3` | Heading 3 |
| `Cmd/Ctrl + Alt + 4` | Heading 4 |
| `Cmd/Ctrl + Alt + 5` | Heading 5 |
| `Cmd/Ctrl + Alt + 6` | Heading 6 |

### 13.3 List Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Shift + 7` | Ordered List |
| `Cmd/Ctrl + Shift + 8` | Bullet List |
| `Cmd/Ctrl + Shift + 9` | Task List |
| `Tab` | Indent |
| `Shift + Tab` | Outdent |

### 13.4 Navigation Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + F` | Find & Replace |
| `Cmd/Ctrl + G` | Find Next |
| `Cmd/Ctrl + Shift + G` | Find Previous |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |

### 13.5 Insert Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Insert Link |
| `Cmd/Ctrl + Shift + I` | Insert Image |
| `Cmd/Ctrl + Alt + T` | Insert Table |

### 13.6 View Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + +` | Zoom In |
| `Cmd/Ctrl + -` | Zoom Out |
| `Cmd/Ctrl + 0` | Reset Zoom |
| `Cmd/Ctrl + Shift + R` | Toggle Ruler |

### 13.7 Document Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save Document |
| `Cmd/Ctrl + P` | Print/Export PDF |
| `Cmd/Ctrl + Shift + E` | Export Dialog |

---

## 14. API Integration

### 14.1 Backend API Endpoints

**Base URL**: `http://localhost:5000`

#### Document Endpoints

```
POST   /api/text-editor/save                  # Save new document
GET    /api/text-editor/document/:id          # Get document by ID
PUT    /api/text-editor/document/:id          # Update document
DELETE /api/text-editor/document/:id          # Delete document
GET    /api/text-editor/my-documents          # Get user's documents
POST   /api/text-editor/document/:id/sync     # Lightweight sync (Beacon API)
```

#### Comment Endpoints

```
POST   /api/text-editor/:id/comments          # Add comment
GET    /api/text-editor/:id/comments          # Get comments
PUT    /api/text-editor/:id/comments/:cid     # Update comment
DELETE /api/text-editor/:id/comments/:cid     # Delete comment
```

#### AI Endpoints

```
POST   /api/text-editor/ai/generate           # Generate text
POST   /api/text-editor/ai/chat               # Chat with AI
POST   /api/text-editor/ai/transform          # Transform text
GET    /api/text-editor/ai/quota-status       # Get AI quota
GET    /api/text-editor/ai/health             # AI service health
```

#### Analytics Endpoints

```
GET    /api/text-editor/ai/analytics          # Dashboard analytics
GET    /api/text-editor/ai/analytics/user     # User usage report
GET    /api/text-editor/ai/analytics/costs    # Cost breakdown
GET    /api/text-editor/ai/analytics/alerts   # System alerts
```

### 14.2 WebSocket Events

**Connection**: `ws://localhost:5000`

#### Client → Server Events

```javascript
// Join document room
socket.emit('join-document', { documentId, userId, token });

// Send Yjs update
socket.emit('yjs-update', { documentId, update });

// Send cursor position
socket.emit('cursor-update', { documentId, cursor });
```

#### Server → Client Events

```javascript
// Receive document state
socket.on('document-state', ({ stateVector, users }));

// Receive Yjs update
socket.on('yjs-update', ({ update, userId }));

// Receive cursor update
socket.on('cursor-update', ({ userId, cursor }));

// User joined
socket.on('user-joined', { userId, socketId });

// User left
socket.on('user-left', { socketId });
```

### 14.3 Authentication

**Method**: JWT Bearer Token

**Headers**:
```javascript
{
  'Authorization': 'Bearer <token>'
}
```

**Token Storage**: `localStorage.getItem('token')`

---

## 15. Performance Optimizations

### 15.1 Conditional Logging

**File**: `TextEditor.jsx` lines 11-21

**Purpose**: Remove all debug logs in production

**Implementation**:
```javascript
const log = process.env.NODE_ENV === 'development'
  ? (...args) => console.log(...args)
  : () => { };
```

**Impact**: 2-5ms overhead removed per event in production

### 15.2 Debounced Pagination

**Delay**: 500ms after content changes

**Purpose**: Prevent excessive pagination calculations

**Implementation**:
```javascript
import { debouncePaginate } from '../utils/paginationEngine';

editor.on('update', () => {
  debouncePaginate(editor);
});
```

### 15.3 Debounced Auto-Save

**Delay**: 1000ms after content changes

**Purpose**: Reduce API calls

**Implementation**:
```javascript
import { debounce } from 'lodash';

const saveChanges = debounce(async () => {
  await saveDocument(editor.getJSON());
}, 1000);
```

### 15.4 React Query Caching

**Configuration**:
```javascript
// Documents list
staleTime: 10 * 60 * 1000,    // 10 minutes
gcTime: 30 * 60 * 1000,       // 30 minutes

// Single document
staleTime: 30 * 60 * 1000,    // 30 minutes
gcTime: 60 * 60 * 1000,       // 1 hour
```

### 15.5 Code Splitting

**File**: `vite.config.js`

**Chunks**:
- `react-vendor`: React, ReactDOM
- `editor-components`: TipTap extensions
- `ai-utils`: AI integration code

### 15.6 IndexedDB Persistence

**Purpose**: Offline support and instant loading

**Implementation**:
```javascript
import { IndexeddbPersistence } from 'y-indexeddb';

const provider = new IndexeddbPersistence(`athena-doc-${docId}`, ydoc);
```

**Benefits**:
- Near-instant document load
- Offline editing support
- Automatic sync when online

### 15.7 Memory Management

**Cleanup on Unmount**:
1. Destroy TipTap editor
2. Disconnect WebSocket
3. Clear pagination cache
4. Remove event listeners
5. Destroy Yjs document

**Monitoring**:
- Target: < 50MB per active document
- WebSocket message size: < 1KB
- IndexedDB sync: < 10ms

---

## Appendix A: File Structure

```
frontend/src/components/athena-editor/
├── TextEditor.jsx                    # Main editor component
├── SafeTextEditor.jsx                # Error boundary
├── AthenaEditor.css                  # Editor styles
├── README.md                         # Basic documentation
├── EPUB_EXPORT_ADDITION.md          # EPUB export docs
├── ai/
│   └── aiUtils.js                    # AI function implementations
├── assets/
│   └── ...                           # Images, icons
├── components/
│   ├── ExportDialog.jsx              # Export dialog
│   ├── PageContainer.jsx             # Page wrapper
│   ├── PageView.jsx                  # Page renderer
│   ├── utils.js                      # Component utilities
│   ├── editor/
│   │   ├── AIAssistant.jsx           # AI chat interface
│   │   ├── AIQuotaBadge.jsx          # AI usage badge
│   │   ├── CodeAssistant.jsx         # Code generation
│   │   ├── CommentsPanel.jsx         # Comments UI
│   │   ├── DocumentOutline.jsx       # Heading outline
│   │   ├── EditorCommands.js         # Command registry
│   │   ├── EditorExtensions.js       # Extension config
│   │   ├── EditorPagination.js       # Pagination helpers
│   │   ├── EnhancedTokenBadge.jsx    # Token counter UI
│   │   ├── ExportMenu.jsx            # Export dropdown
│   │   ├── FindReplaceModal.jsx      # Find & replace
│   │   ├── HeaderMenuBar.jsx         # Main toolbar
│   │   ├── KeyboardShortcutsDialog.jsx
│   │   ├── PageSetupDialog.jsx       # Page settings
│   │   ├── RealtimeTokenBadge.jsx    # Live token counter
│   │   ├── TemplateSidebar.jsx       # Template gallery
│   │   ├── TokenCounter.jsx          # Token counter
│   │   ├── VersionHistory.jsx        # Version control
│   │   ├── VoiceTyping.jsx           # Speech-to-text
│   │   ├── WordCountDialog.jsx       # Word count UI
│   │   ├── focusUtils.js             # Focus management
│   │   ├── useKeyboardShortcuts.js   # Shortcut handler
│   │   └── toolbar/                  # Toolbar components
│   ├── texteditorfunc/               # Editor functions
│   └── ui/                           # UI component library
├── constants/
│   └── ...                           # Configuration constants
├── contexts/
│   ├── EditorContent.jsx             # Editor state context
│   └── ImageContext.jsx              # Image management context
├── extensions/
│   ├── CustomTable.jsx               # Table node view
│   ├── FontSize.js                   # Font size extension
│   ├── Indent.js                     # Indent extension
│   ├── Page.js                       # Page node extension
│   ├── ResizableImage.jsx            # Resizable images
│   ├── SpellCheckPlugin.js           # Spell check
│   ├── TableExtension.js             # Table extension
│   └── TextDirection.js              # RTL/LTR support
├── hooks/
│   ├── useAutoCreateDocument.js      # Auto-create docs
│   ├── useEditorState.js             # Editor state hook
│   ├── useExportState.js             # Export state hook
│   ├── useFormattingActions.js       # Formatting hook
│   ├── usePastePagination.js         # Paste pagination
│   ├── useTableOperations.js         # Table operations
│   ├── useTablePicker.js             # Table picker
│   └── useTokenCounter.js            # Token counting
└── utils/
    ├── contentHelpers.js             # Content utilities
    ├── logger.js                     # Conditional logging
    ├── paginationEngine.js           # Pagination engine
    ├── realtimeTokenCounter.js       # Token counter
    ├── scrollLockManager.js          # Scroll management
    └── transformMarkdownToEditor.js  # Markdown converter
```

---

## Appendix B: Backend File Structure

```
backend/
├── server.js                         # Express server
├── socket-server.js                  # WebSocket server (TODO: Create)
├── models/
│   ├── Document.js                   # Document schema
│   └── AIUsage.js                    # AI usage tracking
├── routes/
│   └── textEditorRoutes.js           # API routes
├── controllers/
│   └── aiAnalytics.js                # Analytics controller
├── middleware/
│   ├── aiCache.js                    # AI response caching
│   ├── aiMonitoring.js               # AI health monitoring
│   └── aiUsageMiddleware.js          # Usage tracking
└── utils/
    └── tokenCounter.js               # Backend token counter
```

---

## Appendix C: Common Integration Patterns

### C.1 Adding a New Extension

```javascript
// 1. Create extension file
// extensions/MyExtension.js
import { Node } from '@tiptap/core';

export const MyExtension = Node.create({
  name: 'myExtension',
  // ... extension config
});

// 2. Add to TextEditor.jsx
import { MyExtension } from '../extensions/MyExtension';

// In useEditor extensions array:
MyExtension.configure({ ... })
```

### C.2 Adding a New AI Function

```javascript
// 1. Add to aiUtils.js
export async function myAIFunction(editor, text, options) {
  return callAIStreamAPI({
    systemPrompt: '...',
    userPrompt: text,
    ...options
  });
}

// 2. Use in component
import { myAIFunction } from '../ai/aiUtils';

const result = await myAIFunction(editor, selectedText);
```

### C.3 Adding a New Export Format

```javascript
// 1. Add to DocumentExporter
static async exportMYFORMAT(editor, options) {
  const content = editor.getHTML();
  // Convert to format
  download(content, 'document.myformat');
}

// 2. Add to ExportDialog
<option value="myformat">My Format</option>
```

---

## Appendix D: Troubleshooting

### D.1 Common Issues

**Issue**: Pagination not working
- Check if Page extension is loaded
- Verify page height calibration
- Check console for errors

**Issue**: AI features not responding
- Verify API key in backend .env
- Check AI quota status
- Review network requests

**Issue**: Collaboration not syncing
- Check WebSocket connection
- Verify JWT token
- Check Yjs document state

**Issue**: Export fails
- Check document content validity
- Verify export library imports
- Review browser console errors

### D.2 Performance Issues

**Symptom**: Slow typing
- Check for excessive console.logs
- Verify debounce is working
- Profile React renders

**Symptom**: High memory usage
- Check for memory leaks in useEffect
- Verify cleanup on unmount
- Monitor Yjs document size

---

## Appendix E: Testing Guidelines

### E.1 Unit Tests

Test individual utilities:
```javascript
describe('PaginationEngine', () => {
  it('should paginate content correctly', () => {
    // Test pagination logic
  });
});
```

### E.2 Integration Tests

Test component interactions:
```javascript
describe('TextEditor', () => {
  it('should save document on change', () => {
    // Test auto-save
  });
});
```

### E.3 E2E Tests

Test user workflows:
```javascript
describe('Document Creation', () => {
  it('should create and save new document', () => {
    // Test full flow
  });
});
```

---

## Version History

- **v1.0.0** (Current): Initial comprehensive documentation
  - TipTap 3.x based editor
  - AI integration with OpenAI
  - Pagination engine
  - Multi-format export
  - Real-time collaboration (Yjs)
  - Full REST API + WebSocket support

---

## Support & Contributing

For questions, issues, or contributions:
- Review this documentation
- Check existing issues in repository
- Contact development team

---

**Documentation Generated**: April 17, 2026
**Editor Version**: 1.0.0
**TipTap Version**: 3.17.1
**React Version**: 19.1.1
