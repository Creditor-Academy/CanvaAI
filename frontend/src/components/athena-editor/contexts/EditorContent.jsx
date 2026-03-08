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
  }
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
  SET_LAST_SAVED: 'SET_LAST_SAVED'
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
      return {
        ...state,
        ...action.payload
      };

    case ACTIONS.UPDATE_UI_STATE:
      return {
        ...state,
        ...action.payload
      };

    case ACTIONS.UPDATE_EDITOR_FEATURES:
      return {
        ...state,
        ...action.payload
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

    default:
      return state;
  }
};

// Create contexts
const EditorStateContext = createContext();
const EditorActionsContext = createContext();

// Provider component
export const EditorProvider = ({ children, initialData = {} }) => {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialState,
    ...initialData
  });

  // Action creators - memoized to be stable
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

  const actions = useMemo(() => ({
    updateDocumentStats,
    updateFormatting,
    updateUIState,
    updateEditorFeatures,
    updateExportOptions,
    setDocumentTitle,
    setSaveStatus,
    setLastSaved
  }), [
    updateDocumentStats,
    updateFormatting,
    updateUIState,
    updateEditorFeatures,
    updateExportOptions,
    setDocumentTitle,
    setSaveStatus,
    setLastSaved
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

// Legacy compatibility hook
export const useEditorContext = () => {
  const state = useEditorState();
  const actions = useEditorActions();
  return { state, actions };
};

// Custom hooks for specific state groups
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
    updateUIState: actions.updateUIState
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
