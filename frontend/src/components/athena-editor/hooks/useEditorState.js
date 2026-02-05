import { useState, useCallback, useEffect } from 'react';
import { useEditorContext } from '../contexts/EditorContext';

// Custom hook to manage editor state with context fallback
export const useEditorState = (initialState = {}) => {
  const { state: contextState, actions } = useEditorContext();
  
  // Document state
  const [documentTitle, setDocumentTitle] = useState(initialState.documentTitle || contextState?.documentTitle || 'Untitled Document');
  const [documentStats, setDocumentStats] = useState(initialState.documentStats || contextState?.documentStats || {
    words: 0,
    characters: 0,
    pages: 1,
    paragraphs: 0,
    tables: 0,
    images: 0,
    headings: 0
  });
  const [lastSaved, setLastSaved] = useState(initialState.lastSaved || contextState?.lastSaved || new Date());
  const [saveStatus, setSaveStatus] = useState(initialState.saveStatus || contextState?.saveStatus || 'saved');
  
  // Formatting state
  const [currentFont, setCurrentFont] = useState(initialState.currentFont || contextState?.currentFont || 'Arial');
  const [currentFontSize, setCurrentFontSize] = useState(initialState.currentFontSize || contextState?.currentFontSize || 11);
  const [currentTextColor, setCurrentTextColor] = useState(initialState.currentTextColor || contextState?.currentTextColor || '#000000');
  const [currentHighlight, setCurrentHighlight] = useState(initialState.currentHighlight || contextState?.currentHighlight || '#ffff00');
  const [lineSpacing, setLineSpacing] = useState(initialState.lineSpacing || contextState?.lineSpacing || 1.15);
  const [activeHeadingLevel, setActiveHeadingLevel] = useState(initialState.activeHeadingLevel || contextState?.activeHeadingLevel || 0);
  
  // UI state
  const [zoom, setZoom] = useState(initialState.zoom || contextState?.zoom || 100);
  const [showRuler, setShowRuler] = useState(initialState.showRuler || contextState?.showRuler || false);
  const [showGrid, setShowGrid] = useState(initialState.showGrid || contextState?.showGrid || false);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(initialState.spellCheckEnabled || contextState?.spellCheckEnabled || true);
  const [isDarkMode, setIsDarkMode] = useState(initialState.isDarkMode || contextState?.isDarkMode || false);
  
  // Editor features
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(initialState.isAISidebarOpen || contextState?.isAISidebarOpen || false);
  const [showReferencesPanel, setShowReferencesPanel] = useState(initialState.showReferencesPanel || contextState?.showReferencesPanel || false);
  const [showTemplateSidebar, setShowTemplateSidebar] = useState(initialState.showTemplateSidebar || contextState?.showTemplateSidebar || false);
  const [showExportDialog, setShowExportDialog] = useState(initialState.showExportDialog || contextState?.showExportDialog || false);
  const [exportFormat, setExportFormat] = useState(initialState.exportFormat || contextState?.exportFormat || 'pdf');
  const [exportOptions, setExportOptions] = useState(initialState.exportOptions || contextState?.exportOptions || {
    includePageNumbers: true,
    includeHeader: true,
    includeFooter: true,
    exportComments: false,
    exportTrackChanges: false
  });

  // Sync with context when values change
  useEffect(() => {
    actions.setDocumentTitle(documentTitle);
  }, [documentTitle, actions]);

  useEffect(() => {
    actions.setSaveStatus(saveStatus);
  }, [saveStatus, actions]);

  useEffect(() => {
    actions.setLastSaved(lastSaved);
  }, [lastSaved, actions]);

  useEffect(() => {
    actions.updateFormatting({
      currentFont,
      currentFontSize,
      currentTextColor,
      currentHighlight,
      lineSpacing,
      activeHeadingLevel
    });
  }, [currentFont, currentFontSize, currentTextColor, currentHighlight, lineSpacing, activeHeadingLevel, actions]);

  useEffect(() => {
    actions.updateUIState({
      zoom,
      showRuler,
      showGrid,
      spellCheckEnabled,
      isDarkMode
    });
  }, [zoom, showRuler, showGrid, spellCheckEnabled, isDarkMode, actions]);

  useEffect(() => {
    actions.updateEditorFeatures({
      isAISidebarOpen,
      showReferencesPanel,
      showTemplateSidebar,
      showExportDialog,
      exportFormat
    });
  }, [isAISidebarOpen, showReferencesPanel, showTemplateSidebar, showExportDialog, exportFormat, actions]);

  useEffect(() => {
    actions.updateExportOptions(exportOptions);
  }, [exportOptions, actions]);

  // Return all state and setters
  return {
    // Document state
    documentTitle,
    setDocumentTitle,
    documentStats,
    setDocumentStats,
    lastSaved,
    setLastSaved,
    saveStatus,
    setSaveStatus,

    // Formatting state
    currentFont,
    setCurrentFont,
    currentFontSize,
    setCurrentFontSize,
    currentTextColor,
    setCurrentTextColor,
    currentHighlight,
    setCurrentHighlight,
    lineSpacing,
    setLineSpacing,
    activeHeadingLevel,
    setActiveHeadingLevel,

    // UI state
    zoom,
    setZoom,
    showRuler,
    setShowRuler,
    showGrid,
    setShowGrid,
    spellCheckEnabled,
    setSpellCheckEnabled,
    isDarkMode,
    setIsDarkMode,

    // Editor features
    isAISidebarOpen,
    setIsAISidebarOpen,
    showReferencesPanel,
    setShowReferencesPanel,
    showTemplateSidebar,
    setShowTemplateSidebar,
    showExportDialog,
    setShowExportDialog,
    exportFormat,
    setExportFormat,
    exportOptions,
    setExportOptions
  };
};

// Custom hook for image state
export const useImageState = (initialState = {}) => {
  const { state: contextState, actions } = useEditorContext();
  
  // Image upload states
  const [selectedFiles, setSelectedFiles] = useState(initialState.selectedFiles || contextState?.selectedFiles || []);
  const [imagePreview, setImagePreview] = useState(initialState.imagePreview || contextState?.imagePreview || '');
  const [uploadProgress, setUploadProgress] = useState(initialState.uploadProgress || contextState?.uploadProgress || 0);
  const [isImageUploading, setIsImageUploading] = useState(initialState.isImageUploading || contextState?.isImageUploading || false);
  const [imageProperties, setImageProperties] = useState(initialState.imageProperties || contextState?.imageProperties || {
    width: 'auto',
    height: 'auto',
    alignment: 'left',
    wrap: 'inline',
    rotation: 0,
    opacity: 100,
    borderColor: '#000000',
    borderWidth: 0
  });

  // Image insertion states
  const [showImageModal, setShowImageModal] = useState(initialState.showImageModal || contextState?.showImageModal || false);
  const [imageInsertMethod, setImageInsertMethod] = useState(initialState.imageInsertMethod || contextState?.imageInsertMethod || 'url');
  const [imageUrl, setImageUrl] = useState(initialState.imageUrl || contextState?.imageUrl || '');
  const [imageSearchQuery, setImageSearchQuery] = useState(initialState.imageSearchQuery || contextState?.imageSearchQuery || '');
  const [unsplashImages, setUnsplashImages] = useState(initialState.unsplashImages || contextState?.unsplashImages || []);
  const [isLoadingImages, setIsLoadingImages] = useState(initialState.isLoadingImages || contextState?.isLoadingImages || false);
  const [selectedImageAlt, setSelectedImageAlt] = useState(initialState.selectedImageAlt || contextState?.selectedImageAlt || '');

  // Media elements states
  const [mediaElements, setMediaElements] = useState(initialState.mediaElements || contextState?.mediaElements || []);
  const [selectedMedia, setSelectedMedia] = useState(initialState.selectedMedia || contextState?.selectedMedia || null);
  const [showMediaPanel, setShowMediaPanel] = useState(initialState.showMediaPanel || contextState?.showMediaPanel || false);
  const [watermarks, setWatermarks] = useState(initialState.watermarks || contextState?.watermarks || []);
  const [shapes, setShapes] = useState(initialState.shapes || contextState?.shapes || []);
  const [drawingMode, setDrawingMode] = useState(initialState.drawingMode || contextState?.drawingMode || null);
  const [drawingColor, setDrawingColor] = useState(initialState.drawingColor || contextState?.drawingColor || '#000000');
  const [drawingStrokeWidth, setDrawingStrokeWidth] = useState(initialState.drawingStrokeWidth || contextState?.drawingStrokeWidth || 2);

  return {
    // Image upload
    selectedFiles,
    setSelectedFiles,
    imagePreview,
    setImagePreview,
    uploadProgress,
    setUploadProgress,
    isImageUploading,
    setIsImageUploading,
    imageProperties,
    setImageProperties,

    // Image insertion
    showImageModal,
    setShowImageModal,
    imageInsertMethod,
    setImageInsertMethod,
    imageUrl,
    setImageUrl,
    imageSearchQuery,
    setImageSearchQuery,
    unsplashImages,
    setUnsplashImages,
    isLoadingImages,
    setIsLoadingImages,
    selectedImageAlt,
    setSelectedImageAlt,

    // Media elements
    mediaElements,
    setMediaElements,
    selectedMedia,
    setSelectedMedia,
    showMediaPanel,
    setShowMediaPanel,
    watermarks,
    setWatermarks,
    shapes,
    setShapes,
    drawingMode,
    setDrawingMode,
    drawingColor,
    setDrawingColor,
    drawingStrokeWidth,
    setDrawingStrokeWidth
  };
};