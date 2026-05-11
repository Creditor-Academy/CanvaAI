import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';

// Initial state
const initialState = {
  // Document state
  documentTitle: 'Untitled Document',
  documentStats: {
    words: 0,
    characters: 0,
    pages: 1,
    paragraphs: 0,
    tables: 0,
    images: 0,
    headings: 0
  },
  lastSaved: new Date(),
  saveStatus: 'saved',

  // Formatting state
  currentFont: 'Arial',
  currentFontSize: 11,
  currentTextColor: '#000000',
  currentHighlight: '#ffff00',
  lineSpacing: 1.15,
  activeHeadingLevel: 0,

  // UI state
  zoom: 100,
  showRuler: false,
  showGrid: false,
  spellCheckEnabled: true,
  isDarkMode: false,
  isOutlineOpen: true,
  isStarred: false,

  // FIX: Use plain object instead of Set — Set is non-serializable and breaks
  // shallow equality checks, causing stale renders and preventing persistence.
  // Usage: collapsedSections[headingId] === true means collapsed.
  collapsedSections: {},

  // Modals & Dialogs
  showFindReplaceModal: false,
  findReplaceMode: 'find',
  showAIAssistant: false,
  showImportModal: false,
  isImporting: false,
  isDragging: false,
  importError: null,

  // Editor features
  showReferencesPanel: false,
  isAISidebarOpen: false,
  showTemplateSidebar: false,
  showExportDialog: false,

  // Export options
  exportFormat: 'pdf',
  exportOptions: {
    includePageNumbers: true,
    includeHeader: true,
    includeFooter: true,
    exportComments: false,
    exportTrackChanges: false
  },

  // Versioning
  documentVersions: [{ id: Date.now(), timestamp: new Date(), title: 'Initial Version', content: '', author: 'Current User' }],
  showVersionHistory: false,
  restoreTarget: null,
  showDeleteConfirm: false,

  // Image Modal
  showImageModal: false,
  imageInsertMethod: 'url',
  imageUrl: '',
  selectedImageAlt: '',
  isImageUploading: false,
  uploadProgress: 0,

  // Pagination & Layout
  pageSize: 'A4',
  pageOrientation: 'portrait',
  pageMargins: { top: 86, bottom: 86, left: 96, right: 96 },
  pageColor: '#ffffff',
};

// Action types
const ACTIONS = {
  UPDATE_DOCUMENT_STATS: 'UPDATE_DOCUMENT_STATS',
  UPDATE_FORMATTING: 'UPDATE_FORMATTING',
  UPDATE_UI_STATE: 'UPDATE_UI_STATE',
  UPDATE_EDITOR_FEATURES: 'UPDATE_EDITOR_FEATURES',
  UPDATE_EXPORT_OPTIONS: 'UPDATE_EXPORT_OPTIONS',
  SET_DOCUMENT_TITLE: 'SET_DOCUMENT_TITLE',
  SET_SAVE_STATUS: 'SET_SAVE_STATUS',
  SET_LAST_SAVED: 'SET_LAST_SAVED',
  TOGGLE_SECTION_COLLAPSE: 'TOGGLE_SECTION_COLLAPSE',
};

// UI-slice keys — the only keys UPDATE_UI_STATE is allowed to touch.
// This prevents callers from accidentally overwriting document or formatting state.
const UI_STATE_KEYS = new Set([
  'zoom', 'showRuler', 'showGrid', 'spellCheckEnabled', 'isDarkMode',
  'isOutlineOpen', 'isStarred',
  'showFindReplaceModal', 'findReplaceMode', 'showAIAssistant',
  'showImportModal', 'isImporting', 'isDragging', 'importError',
  'documentVersions', 'showVersionHistory', 'restoreTarget', 'showDeleteConfirm',
  'showImageModal', 'imageInsertMethod', 'imageUrl', 'selectedImageAlt',
  'isImageUploading', 'uploadProgress',
  'pageSize', 'pageOrientation', 'pageMargins', 'pageColor',
]);

// Formatting-slice keys — the only keys UPDATE_FORMATTING is allowed to touch.
const FORMATTING_KEYS = new Set([
  'currentFont', 'currentFontSize', 'currentTextColor',
  'currentHighlight', 'lineSpacing', 'activeHeadingLevel',
]);

// Editor-features-slice keys
const FEATURES_KEYS = new Set([
  'showReferencesPanel', 'isAISidebarOpen', 'showTemplateSidebar',
  'showExportDialog', 'exportFormat',
]);

/**
 * Filter a payload object to only include keys in the allowed set.
 * Unknown keys are silently dropped — they belong to a different slice.
 */
const filterPayload = (payload, allowedKeys) => {
  const out = {};
  for (const key of Object.keys(payload)) {
    if (allowedKeys.has(key)) out[key] = payload[key];
  }
  return out;
};

// Reducer function
const editorReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.UPDATE_DOCUMENT_STATS:
      return {
        ...state,
        documentStats: { ...state.documentStats, ...action.payload }
      };

    case ACTIONS.UPDATE_FORMATTING:
      // Safe: only touches formatting slice keys
      return {
        ...state,
        ...filterPayload(action.payload, FORMATTING_KEYS)
      };

    case ACTIONS.UPDATE_UI_STATE:
      // Safe: only touches UI slice keys
      return {
        ...state,
        ...filterPayload(action.payload, UI_STATE_KEYS)
      };

    case ACTIONS.UPDATE_EDITOR_FEATURES:
      // Safe: only touches features slice keys
      return {
        ...state,
        ...filterPayload(action.payload, FEATURES_KEYS)
      };

    case ACTIONS.UPDATE_EXPORT_OPTIONS:
      return {
        ...state,
        exportOptions: { ...state.exportOptions, ...action.payload }
      };

    case ACTIONS.SET_DOCUMENT_TITLE:
      return {
        ...state,
        documentTitle: action.payload
      };

    case ACTIONS.SET_SAVE_STATUS:
      return {
        ...state,
        saveStatus: action.payload
      };

    case ACTIONS.SET_LAST_SAVED:
      return {
        ...state,
        lastSaved: action.payload
      };

    case ACTIONS.TOGGLE_SECTION_COLLAPSE: {
      const headingId = action.payload;
      const current = state.collapsedSections;
      // Toggle: if present remove, if absent add
      const updated = { ...current };
      if (updated[headingId]) {
        delete updated[headingId];
      } else {
        updated[headingId] = true;
      }
      return { ...state, collapsedSections: updated };
    }

    default:
      return state;
  }
};

// Create contexts — split state/actions to prevent actions consumers from
// re-rendering on every state change.
const EditorStateContext = createContext();
const EditorActionsContext = createContext();

// Provider component
export const EditorProvider = ({ children, initialData = {} }) => {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialState,
    ...initialData
  });

  // Action creators — all stable (no deps that change)
  const updateDocumentStats = useCallback((stats) => {
    dispatch({ type: ACTIONS.UPDATE_DOCUMENT_STATS, payload: stats });
  }, []);

  const updateFormatting = useCallback((formatting) => {
    dispatch({ type: ACTIONS.UPDATE_FORMATTING, payload: formatting });
  }, []);

  const updateUIState = useCallback((uiState) => {
    dispatch({ type: ACTIONS.UPDATE_UI_STATE, payload: uiState });
  }, []);

  const updateEditorFeatures = useCallback((features) => {
    dispatch({ type: ACTIONS.UPDATE_EDITOR_FEATURES, payload: features });
  }, []);

  const updateExportOptions = useCallback((options) => {
    dispatch({ type: ACTIONS.UPDATE_EXPORT_OPTIONS, payload: options });
  }, []);

  const setDocumentTitle = useCallback((title) => {
    dispatch({ type: ACTIONS.SET_DOCUMENT_TITLE, payload: title });
  }, []);

  const setSaveStatus = useCallback((status) => {
    dispatch({ type: ACTIONS.SET_SAVE_STATUS, payload: status });
  }, []);

  const setLastSaved = useCallback((date) => {
    dispatch({ type: ACTIONS.SET_LAST_SAVED, payload: date });
  }, []);

  const toggleSectionCollapse = useCallback((headingId) => {
    dispatch({ type: ACTIONS.TOGGLE_SECTION_COLLAPSE, payload: headingId });
  }, []);

  const actions = useMemo(() => ({
    updateDocumentStats,
    updateFormatting,
    updateUIState,
    updateEditorFeatures,
    updateExportOptions,
    setDocumentTitle,
    setSaveStatus,
    setLastSaved,
    toggleSectionCollapse,
  }), [
    updateDocumentStats,
    updateFormatting,
    updateUIState,
    updateEditorFeatures,
    updateExportOptions,
    setDocumentTitle,
    setSaveStatus,
    setLastSaved,
    toggleSectionCollapse,
  ]);

  return (
    <EditorActionsContext.Provider value={actions}>
      <EditorStateContext.Provider value={state}>
        {children}
      </EditorStateContext.Provider>
    </EditorActionsContext.Provider>
  );
};

// Custom hook to use the editor state
export const useEditorState = () => {
  const context = useContext(EditorStateContext);
  if (context === undefined) {
    throw new Error('useEditorState must be used within an EditorProvider');
  }
  return context;
};

// Custom hook to use the editor actions
export const useEditorActions = () => {
  const context = useContext(EditorActionsContext);
  if (context === undefined) {
    throw new Error('useEditorActions must be used within an EditorProvider');
  }
  return context;
};

// Legacy compatibility hook — use granular hooks below in new code
export const useEditorContext = () => {
  const state = useEditorState();
  const actions = useEditorActions();
  return { state, actions };
};

// ── Granular selector hooks ───────────────────────────────────────────────────
// Each hook only exposes its own slice — components using these will only
// re-render when their specific slice changes.

export const useDocumentState = () => {
  const state = useEditorState();
  const actions = useEditorActions();

  return {
    documentTitle: state.documentTitle,
    documentStats: state.documentStats,
    lastSaved: state.lastSaved,
    saveStatus: state.saveStatus,
    setDocumentTitle: actions.setDocumentTitle,
    setSaveStatus: actions.setSaveStatus,
    setLastSaved: actions.setLastSaved,
    updateDocumentStats: actions.updateDocumentStats
  };
};

export const useFormattingState = () => {
  const state = useEditorState();
  const actions = useEditorActions();

  return {
    currentFont: state.currentFont,
    currentFontSize: state.currentFontSize,
    currentTextColor: state.currentTextColor,
    currentHighlight: state.currentHighlight,
    lineSpacing: state.lineSpacing,
    activeHeadingLevel: state.activeHeadingLevel,
    updateFormatting: actions.updateFormatting
  };
};

export const useUIState = () => {
  const state = useEditorState();
  const actions = useEditorActions();

  return {
    zoom: state.zoom,
    showRuler: state.showRuler,
    showGrid: state.showGrid,
    spellCheckEnabled: state.spellCheckEnabled,
    isDarkMode: state.isDarkMode,
    isOutlineOpen: state.isOutlineOpen,
    isStarred: state.isStarred,
    collapsedSections: state.collapsedSections,

    // Modals
    showFindReplaceModal: state.showFindReplaceModal,
    findReplaceMode: state.findReplaceMode,
    showAIAssistant: state.showAIAssistant,
    showImportModal: state.showImportModal,
    isImporting: state.isImporting,
    isDragging: state.isDragging,
    importError: state.importError,

    // Versioning
    documentVersions: state.documentVersions,
    showVersionHistory: state.showVersionHistory,
    restoreTarget: state.restoreTarget,
    showDeleteConfirm: state.showDeleteConfirm,

    // Image Modal
    showImageModal: state.showImageModal,
    imageInsertMethod: state.imageInsertMethod,
    imageUrl: state.imageUrl,
    selectedImageAlt: state.selectedImageAlt,
    isImageUploading: state.isImageUploading,
    uploadProgress: state.uploadProgress,

    // Layout
    pageSize: state.pageSize,
    pageOrientation: state.pageOrientation,
    pageMargins: state.pageMargins,
    pageColor: state.pageColor,

    updateUIState: actions.updateUIState,
    toggleSectionCollapse: actions.toggleSectionCollapse,
  };
};

export const useEditorFeatures = () => {
  const state = useEditorState();
  const actions = useEditorActions();

  return {
    showReferencesPanel: state.showReferencesPanel,
    isAISidebarOpen: state.isAISidebarOpen,
    showTemplateSidebar: state.showTemplateSidebar,
    showExportDialog: state.showExportDialog,
    exportFormat: state.exportFormat,
    exportOptions: state.exportOptions,
    updateEditorFeatures: actions.updateEditorFeatures,
    updateExportOptions: actions.updateExportOptions
  };
};
