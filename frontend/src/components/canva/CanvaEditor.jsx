import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getFilterCSS, getShadowCSS, hexToRgba } from '../../utils/styleUtils';
import { isHeadingLayer } from '../../utils/textUtils';
import TextFormattingToolbar from './components/TextFormattingToolbar';
import ImageEditingToolbar from './components/ImageEditingToolbar';
import BottomToolbar from './components/BottomToolbar';
import SaveExportModal from './SaveExportModal';
import TextStyleModal from './TextStyleModal';
import RightSidebar from './components/RightSidebar';
import CanvasArea from './canvas/CanvasArea';
import LeftCanvasSidebar from './components/leftCanvasSidebar';

// Import hooks
import { useHistory } from './hooks/useHistory';
import { useCanvasTransforms } from './hooks/useCanvasTransforms';
import { useLayerActions } from './hooks/useLayerActions';
import { useDrawing } from './hooks/useDrawing';
import { useScrollbars } from './hooks/useScrollbars';
import { useProjectLoader } from './hooks/useProjectLoader';
import { useCanvasInteractions } from './hooks/useCanvasInteractions';
import { useElementCreation } from './hooks/useElementCreation';

// Import utilities
import { exportCanvasAsImage } from './export/exportCanvasAsImage';
import { getShapeDisplayProps } from './shapes/shapeCssMapper';
import { createTextContentHandler, createTextSettingsHandler, createEnhanceTextHandler } from './text/textHandlers';
import {
  initialTemplates,
  initialTextSettings,
  initialShapeSettings,
  initialImageSettings,
  initialDrawingSettings,
  initialCanvasSize,
  initialOpenSections,
  SCROLLER_THICKNESS,
  SCROLLER_MARGIN
} from './state/initialState';

const CanvaEditor = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  // Core state
  const [selectedTool, setSelectedTool] = useState('select');
  const [layers, setLayers] = useState([]);
  const [canvasSize, setCanvasSize] = useState(initialCanvasSize);
  const [templates] = useState(initialTemplates);
  const [textSettings, setTextSettings] = useState(initialTextSettings);
  const [shapeSettings, setShapeSettings] = useState(initialShapeSettings);
  const [imageSettings, setImageSettings] = useState(initialImageSettings);
  const [openSections, setOpenSections] = useState(initialOpenSections);
  const [hasChosenTemplate, setHasChosenTemplate] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [canvasBgColor, setCanvasBgColor] = useState('#22c55e'); // Default green
  const [hoveredOption, setHoveredOption] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [isHeading, setIsHeading] = useState(false);

  // Save/Export modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('png');
  const [exportQuality, setExportQuality] = useState(0.92);
  const [isExporting, setIsExporting] = useState(false);
  const [includeProjectFile, setIncludeProjectFile] = useState(true);
  const [isSavingWorksheet, setIsSavingWorksheet] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [isEnhancingText, setIsEnhancingText] = useState(false);
  const [pages, setPages] = useState([{ id: 1, layers: [] }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);

  // Refs - store refs per page
  const canvasAreaRefs = useRef({});
  const contentWrapperRefs = useRef({});
  const fileInputRef = useRef(null);
  const strokeColorInputRef = useRef(null);
  const textColorInputRef = useRef(null);
  const isLoadingPageRef = useRef(false);

  // Get or create refs for a page
  const getOrCreateRefs = useCallback((pageId) => {
    if (!canvasAreaRefs.current[pageId]) {
      canvasAreaRefs.current[pageId] = { current: null };
    }
    if (!contentWrapperRefs.current[pageId]) {
      contentWrapperRefs.current[pageId] = { current: null };
    }
    return {
      canvasAreaRef: canvasAreaRefs.current[pageId],
      contentWrapperRef: contentWrapperRefs.current[pageId]
    };
  }, []);

  // For hooks that need refs, use the current page's refs
  const currentPageId = pages[currentPageIndex]?.id;
  const currentPageRefs = currentPageId ? getOrCreateRefs(currentPageId) : { canvasAreaRef: { current: null }, contentWrapperRef: { current: null } };
  const canvasAreaRef = currentPageRefs.canvasAreaRef;
  const contentWrapperRef = currentPageRefs.contentWrapperRef;

  // Initialize hooks
  const {
    history,
    historyIndex,
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory(layers);

  const {
    zoom,
    pan,
    setZoom,
    setPan,
    canvasRef,
    getCanvasPoint,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleFitToScreen
  } = useCanvasTransforms(100, { x: 0, y: 0 });

  const {
    selectedLayer,
    setSelectedLayer,
    draggedLayer,
    dragOverIndex,
    isLayerDragging,
    renamingLayerId,
    setRenamingLayerId,
    renameValue,
    setRenameValue,
    handleLayerSelect: handleLayerSelectBase,
    handleLayerDelete,
    handleLayerToggleVisibility,
    handleLayerDuplicate,
    handleLayerMoveUp,
    handleLayerMoveDown,
    startRenameLayer,
    commitRenameLayer,
    handleLayerDragStart,
    handleLayerDragOver,
    handleLayerDragLeave,
    handleLayerDrop,
    handleLayerDragEnd,
    getLayerPrimaryColor,
    handleQuickColorChange
  } = useLayerActions(layers, setLayers, saveToHistory);

  const {
    drawingSettings,
    setDrawingSettings,
    drawingData,
    currentPath,
    setCurrentPath,
    handleDrawingSettingsChange,
    handleDrawingMouseDown,
    handleEraserAction,
    addPointToPath,
    finishDrawing
  } = useDrawing(layers, setLayers, selectedTool, getCanvasPoint, saveToHistory, setSelectedLayer);

  const {
    scrollMetrics,
    handleHThumbMouseDown,
    handleVThumbMouseDown,
    handleHTrackClick,
    handleVTrackClick
  } = useScrollbars(canvasAreaRef, contentWrapperRef, zoom, pan, canvasSize, layers, hasChosenTemplate);

  const {
    isDragging,
    isResizing,
    isRotating,
    mousePosition,
    isMouseOverCanvas,
    handleMouseDown,
    handleResizeMouseDown,
    handleRotateMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseLeave,
    handleCanvasClick: handleCanvasClickBase
  } = useCanvasInteractions(
    layers,
    setLayers,
    selectedLayer,
    setSelectedLayer,
    selectedTool,
    getCanvasPoint,
    saveToHistory
  );

  const { handleAddElement } = useElementCreation(
    layers,
    setLayers,
    setSelectedLayer,
    canvasSize,
    textSettings,
    shapeSettings,
    saveToHistory
  );

  // Load project data
  useProjectLoader(setLayers, setCanvasSize, setZoom, setPan);

  // Add default heading when page opens and there are no layers
  const hasInitializedRef = useRef(false);
  const projectLoadTimeoutRef = useRef(null);
  const layersRef = useRef(layers);

  // Keep layersRef in sync with layers
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    // Only add default heading if:
    // 1. We haven't initialized yet
    // 2. There are no layers
    // 3. We have the necessary functions available
    if (!hasInitializedRef.current && layers.length === 0 && handleAddElement && saveToHistory) {
      // Clear any existing timeout
      if (projectLoadTimeoutRef.current) {
        clearTimeout(projectLoadTimeoutRef.current);
      }

      // Wait a bit to ensure project loader has finished (if loading a project)
      // If no projectId, this will still work for new projects
      projectLoadTimeoutRef.current = setTimeout(() => {
        // Check current layers state (not closure value)
        if (layersRef.current.length === 0 && !hasInitializedRef.current) {
          // Create a default heading at center-top of canvas
          const centerX = Math.max(100, (canvasSize.width - 300) / 2);
          const centerY = 100;
          handleAddElement(centerX, centerY, 'heading');
          hasInitializedRef.current = true;
        }
      }, projectId ? 1000 : 300); // Longer delay if loading a project

      return () => {
        if (projectLoadTimeoutRef.current) {
          clearTimeout(projectLoadTimeoutRef.current);
        }
      };
    } else if (layers.length > 0) {
      // If layers exist, mark as initialized so we don't add heading
      hasInitializedRef.current = true;
    }
  }, [layers.length, handleAddElement, saveToHistory, canvasSize, projectId]);

  const toggleSection = (key) => {
    setOpenSections(prev => {
      const isCurrentlyOpen = !!prev[key];
      const nextState = Object.keys(prev).reduce((acc, sectionKey) => {
        acc[sectionKey] = false;
        return acc;
      }, {});
      nextState[key] = !isCurrentlyOpen;
      return nextState;
    });
  };
  // Refs are provided by hooks - only keep fileInputRef and color input refs that aren't in hooks

  // Handle undo/redo with layer updates
  const handleUndo = () => {
    const newLayers = undo();
    if (newLayers) {
      setLayers(newLayers);
    }
  };

  const handleRedo = () => {
    const newLayers = redo();
    if (newLayers) {
      setLayers(newLayers);
    }
  };

  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);
    setSelectedLayer(null);
    // Set drawing mode when selecting drawing tools
    if (['brush', 'pen', 'eraser'].includes(toolId)) {
      setDrawingSettings(prev => ({ ...prev, drawingMode: toolId }));
    }
  };

  // Wrapper for handleAddElement to pass selectedTool
  const handleAddElementWrapper = useCallback((x = 100, y = 100, toolOverride = null) => {
    handleAddElement(x, y, toolOverride, selectedTool);
  }, [handleAddElement, selectedTool]);

  // Enhanced handleLayerSelect with text settings sync
  const handleLayerSelect = useCallback((layerId) => {
    handleLayerSelectBase(layerId);
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.type === 'text') {
      setTextSettings({
        fontSize: layer.fontSize || 16,
        fontFamily: layer.fontFamily || 'Arial',
        fontWeight: layer.fontWeight || 'normal',
        fontStyle: layer.fontStyle || 'normal',
        textDecoration: layer.textDecoration || 'none',
        color: layer.color || '#000000',
        textAlign: layer.textAlign || 'left'
      });
      const isHeadingText = isHeadingLayer(layer);
      setIsHeading(isHeadingText);
    }
  }, [handleLayerSelectBase, layers]);

  // handleLayerDelete is already provided by useLayerActions hook

  // Keyboard shortcuts and custom events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedLayer) {
        handleLayerDelete(selectedLayer);
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    const handleOpenTextStyleModal = () => {
      const selectedTextLayer = layers.find(l => l.id === selectedLayer && l.type === 'text');
      if (selectedTextLayer && selectedTextLayer.text && selectedTextLayer.text.trim()) {
        setShowStyleModal(true);
      }
    };

    const handleAddStyledImageFromEvent = (e) => {
      try {
        handleAddStyledImageToCanvas(e.detail.imageUrl);
      } catch (error) {
        console.error('Error adding styled image to canvas:', error);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openTextStyleModal', handleOpenTextStyleModal);
    window.addEventListener('addStyledImageToCanvas', handleAddStyledImageFromEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openTextStyleModal', handleOpenTextStyleModal);
      window.removeEventListener('addStyledImageToCanvas', handleAddStyledImageFromEvent);
    };
  }, [selectedLayer, handleLayerDelete, handleUndo, handleRedo, layers]);

  // All layer action handlers are provided by useLayerActions hook

  // Export: open modal with export options
  const handleExport = () => {
    setIsSaveModalOpen(true);
  };

  //Handle save canva design (new + existing)
  const handleSave = async () => {
    const design = { layers, canvasSize, zoom, pan };

    try {
      if (projectId) {
        await api.updateProjectDesign(projectId, design);
        alert('Design saved successfully!');
      } else {
        const newProjectData = {
          title: "Untitled Design",
          desc: "Created in Canva Clone",
          icon: "🎨",
          category: "General",
          status: "Active",
          design: design,
        };

        const newProject = await api.createProject(newProjectData);

        if (newProject && newProject._id) {
          alert('Project created successfully!');

          navigate(`/canva-clone/${newProject._id}`, { replace: true });
        }
      }
    } catch (error) {
      console.error('Failed to save design:', error);
      alert('Error saving design. Please try again.');
    }
  };

  // Duplicate currently selected layer (if any)
  const handleDuplicateSelected = () => {
    if (!selectedLayer) return;
    handleLayerDuplicate(selectedLayer);
  };

  // Export function wrapper
  const exportCanvasAsImageWrapper = async (format = 'png', quality = 0.92) => {
    return await exportCanvasAsImage(layers, canvasSize, format, quality);
  };

  const handleDownloadExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await exportCanvasAsImageWrapper(exportFormat, exportQuality);
      if (!dataUrl) return;
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const ext = exportFormat === 'jpeg' ? 'jpg' : 'png';
      link.download = `design-${timestamp}.${ext}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Optionally persist and download project file (worksheet)
      try {
        const design = { layers, canvasSize, zoom: 100, pan: { x: 0, y: 0 }, savedAt: Date.now() };
        localStorage.setItem('canvaDesign', JSON.stringify(design));
        if (includeProjectFile) {
          const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const jsonLink = document.createElement('a');
          jsonLink.href = url;
          jsonLink.download = `design-${timestamp}.json`;
          document.body.appendChild(jsonLink);
          jsonLink.click();
          document.body.removeChild(jsonLink);
          URL.revokeObjectURL(url);
        }
      } catch { }
    } finally {
      setIsExporting(false);
      setIsSaveModalOpen(false);
    }
  };

  // Save worksheet (project JSON) to a user-chosen location using File System Access API
  const handleSaveWorksheetToLocation = async () => {
    if (isSavingWorksheet) return;
    setIsSavingWorksheet(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const design = { layers, canvasSize, zoom, pan, savedAt: Date.now() };
      const fileName = `design-${timestamp}.json`;

      // Feature-detect the File System Access API
      const canUseFSA = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
      if (canUseFSA) {
        const opts = {
          suggestedName: fileName,
          types: [
            {
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] }
            }
          ]
        };
        try {
          // @ts-ignore - showSaveFilePicker is not in TS DOM lib on all versions
          const handle = await window.showSaveFilePicker(opts);
          const writable = await handle.createWritable();
          await writable.write(new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' }));
          await writable.close();
        } catch (err) {
          // If user cancels or error occurs, silently ignore
        }
      } else {
        // Fallback: trigger a regular download (user chooses location via browser dialog)
        const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsSavingWorksheet(false);
    }
  };

  // Text handlers using utilities
  const handleTextContentChange = createTextContentHandler(
    selectedLayer,
    layers,
    setLayers,
    saveToHistory,
    false
  );

  const handleTextContentChangeWithResize = createTextContentHandler(
    selectedLayer,
    layers,
    setLayers,
    saveToHistory,
    true
  );

  const handleTextSettingsChange = createTextSettingsHandler(
    selectedLayer,
    layers,
    setLayers,
    saveToHistory
  );

  const handleEnhanceText = createEnhanceTextHandler(
    selectedLayer,
    layers,
    isHeading,
    handleTextContentChangeWithResize,
    setIsEnhancingText
  );

  // Text formatting handlers
  const handleToggleBold = useCallback(() => {
    if (!selectedLayer) return;
    const layer = layers.find(l => l.id === selectedLayer);
    if (layer && layer.type === 'text') {
      const newWeight = layer.fontWeight === 'bold' || layer.fontWeight === '700' ? 'normal' : 'bold';
      handleTextSettingsChange('fontWeight', newWeight);
    }
  }, [selectedLayer, layers, handleTextSettingsChange]);

  const handleToggleItalic = useCallback(() => {
    if (!selectedLayer) return;
    const layer = layers.find(l => l.id === selectedLayer);
    if (layer && layer.type === 'text') {
      const newStyle = layer.fontStyle === 'italic' ? 'normal' : 'italic';
      handleTextSettingsChange('fontStyle', newStyle);
    }
  }, [selectedLayer, layers, handleTextSettingsChange]);

  const handleToggleUnderline = useCallback(() => {
    if (!selectedLayer) return;
    const layer = layers.find(l => l.id === selectedLayer);
    if (layer && layer.type === 'text') {
      const newDecoration = layer.textDecoration === 'underline' ? 'none' : 'underline';
      handleTextSettingsChange('textDecoration', newDecoration);
    }
  }, [selectedLayer, layers, handleTextSettingsChange]);

  const handleToggleStrikethrough = useCallback(() => {
    if (!selectedLayer) return;
    const layer = layers.find(l => l.id === selectedLayer);
    if (layer && layer.type === 'text') {
      const newDecoration = layer.textDecoration === 'line-through' ? 'none' : 'line-through';
      handleTextSettingsChange('textDecoration', newDecoration);
    }
  }, [selectedLayer, layers, handleTextSettingsChange]);

  const handleToggleCase = useCallback(() => {
    if (!selectedLayer) return;
    const layer = layers.find(l => l.id === selectedLayer);
    if (layer && layer.type === 'text' && layer.text) {
      const newText = layer.text === layer.text.toUpperCase()
        ? layer.text.toLowerCase()
        : layer.text.toUpperCase();
      handleTextContentChange(newText);
    }
  }, [selectedLayer, layers, handleTextContentChange]);

  const handleTextAlignChange = useCallback((align) => {
    handleTextSettingsChange('textAlign', align);
  }, [handleTextSettingsChange]);

  const handleTextColorChange = useCallback((color) => {
    handleTextSettingsChange('color', color);
  }, [handleTextSettingsChange]);

  const handleEffects = useCallback(() => {
    if (selectedLayer) {
      setShowStyleModal(true);
    }
  }, [selectedLayer]);

  const handleAnimate = useCallback(() => {
    // Placeholder for animation feature
    alert('Animation feature coming soon!');
  }, []);

  const handlePosition = useCallback(() => {
    // Placeholder for position feature
    alert('Position feature coming soon!');
  }, []);

  // Image editing handlers
  const handleImageEdit = useCallback(() => {
    if (selectedLayer) {
      setSelectedTool('select');
      // Could open image editor modal here
      alert('Image editor coming soon!');
    }
  }, [selectedLayer]);

  const handleImageEraser = useCallback(() => {
    setSelectedTool('eraser');
  }, []);

  const handleImageClear = useCallback(() => {
    if (selectedLayer && window.confirm('Clear this image?')) {
      handleLayerDelete(selectedLayer);
    }
  }, [selectedLayer, handleLayerDelete]);

  const handleImageAlign = useCallback(() => {
    if (selectedLayer) {
      const layer = layers.find(l => l.id === selectedLayer);
      if (layer) {
        const newX = (canvasSize.width - layer.width) / 2;
        const newY = (canvasSize.height - layer.height) / 2;
        const newLayers = layers.map(l =>
          l.id === selectedLayer ? { ...l, x: newX, y: newY } : l
        );
        setLayers(newLayers);
        saveToHistory(newLayers);
      }
    }
  }, [selectedLayer, layers, canvasSize, setLayers, saveToHistory]);

  const handleImageDraw = useCallback(() => {
    setSelectedTool('brush');
  }, []);

  const handleImageFlip = useCallback(() => {
    if (selectedLayer) {
      const layer = layers.find(l => l.id === selectedLayer);
      if (layer && layer.type === 'image') {
        const newLayers = layers.map(l =>
          l.id === selectedLayer ? { ...l, flipped: !l.flipped } : l
        );
        setLayers(newLayers);
        saveToHistory(newLayers);
      }
    }
  }, [selectedLayer, layers, setLayers, saveToHistory]);

  // Handle page removal
  const handlePageRemove = useCallback((pageId) => {
    setPages(prevPages => {
      const filteredPages = prevPages.filter(page => page.id !== pageId);

      // If we removed the current page, adjust the current page index
      const removedPageIndex = prevPages.findIndex(page => page.id === pageId);
      if (removedPageIndex >= 0) {
        if (removedPageIndex === currentPageIndex) {
          // If we removed the current page, switch to the previous page or first page
          if (filteredPages.length > 0) {
            const newIndex = removedPageIndex > 0 ? removedPageIndex - 1 : 0;
            setCurrentPageIndex(newIndex);
            // Load layers from the new current page
            setLayers(filteredPages[newIndex]?.layers || []);
          } else {
            // If no pages left, create a new one
            const newPage = { id: Date.now(), layers: [] };
            setCurrentPageIndex(0);
            setLayers([]);
            return [newPage];
          }
        } else if (removedPageIndex < currentPageIndex) {
          // If we removed a page before the current one, adjust the index
          setCurrentPageIndex(prev => prev - 1);
        }
      }

      return filteredPages.length > 0 ? filteredPages : [{ id: Date.now(), layers: [] }];
    });
  }, [currentPageIndex, setLayers]);

  // Page management - save current page layers when switching
  // Use a ref to track if we're currently loading a page to avoid infinite loops
  useEffect(() => {
    if (isLoadingPageRef.current) {
      isLoadingPageRef.current = false;
      return;
    }

    if (pages && pages.length > 0 && currentPageIndex >= 0 && currentPageIndex < pages.length) {
      const currentPage = pages[currentPageIndex];
      if (currentPage) {
        // Only update if layers actually changed
        const currentLayersStr = JSON.stringify(currentPage.layers || []);
        const newLayersStr = JSON.stringify(layers);
        if (currentLayersStr !== newLayersStr) {
          setPages(prevPages => {
            const updatedPages = [...prevPages];
            if (updatedPages[currentPageIndex]) {
              updatedPages[currentPageIndex] = { ...updatedPages[currentPageIndex], layers: [...layers] };
            }
            return updatedPages;
          });
        }
      }
    }
  }, [layers, currentPageIndex]); // Save layers whenever they change

  const handleAddPage = useCallback(() => {
    // Save current page first
    setPages(prevPages => {
      const updatedPages = [...prevPages];
      if (updatedPages[currentPageIndex]) {
        updatedPages[currentPageIndex] = { ...updatedPages[currentPageIndex], layers: [...layers] };
      }

      const newPage = {
        id: Date.now(),
        layers: []
      };
      const newPages = [...updatedPages, newPage];
      return newPages;
    });
  }, [currentPageIndex, layers]);

  const handlePageChange = useCallback((index) => {
    if (index >= 0 && index < pages.length && index !== currentPageIndex) {
      // Save current page layers
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = { ...pages[currentPageIndex], layers: [...layers] };
      setPages(updatedPages);

      // Load new page layers
      isLoadingPageRef.current = true;
      setCurrentPageIndex(index);
      setLayers(pages[index].layers || []);
      setSelectedLayer(null);
    }
  }, [pages, currentPageIndex, layers]);

  const handleMaximize = useCallback(() => {
    setIsMaximized(prev => !prev);
  }, []);

  // Add styled image to canvas
  const handleAddStyledImageToCanvas = (imageUrl) => {
    const newLayer = {
      id: Date.now().toString(),
      type: 'image',
      src: imageUrl,
      x: canvasSize.width / 2 - 100,
      y: canvasSize.height / 2 - 100,
      width: 200,
      height: 200,
      opacity: 100,
      brightness: 100,
      contrast: 100,
      blur: 0,
      cornerRadius: 0,
      strokeWidth: 0,
      strokeColor: '#000000',
      shadows: { enabled: false }
    };
    setLayers(prev => [...prev, newLayer]);
    saveToHistory();
  };

  // Shape settings handler
  const handleShapeSettingsChange = useCallback((property, value) => {
    if (!selectedLayer) return;
    const layer = layers.find(l => l.id === selectedLayer);
    if (layer && layer.type === 'shape') {
      const newLayers = layers.map(l =>
        l.id === selectedLayer ? { ...l, [property]: value } : l
      );
      setLayers(newLayers);
      saveToHistory(newLayers);
    }
  }, [selectedLayer, layers, setLayers, saveToHistory]);

  // Image upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage = {
          id: Date.now().toString(),
          type: 'image',
          src: event.target.result,
          x: canvasSize.width / 2 - 100,
          y: canvasSize.height / 2 - 100,
          width: 200,
          height: 200,
          opacity: 100,
          brightness: 100,
          contrast: 100,
          blur: 0,
          cornerRadius: 0,
          strokeWidth: 0,
          strokeColor: '#000000',
          shadows: { enabled: false }
        };
        setLayers(prev => [...prev, newImage]);
        setSelectedLayer(newImage.id);
        saveToHistory();
      };
      reader.readAsDataURL(file);
    }
  };

  // AI generated image handler
  const handleAIGeneratedImage = (newImage) => {
    setLayers(prev => [...prev, newImage]);
    setSelectedLayer(newImage.id);
    saveToHistory();
  };

  // Template selection handler
  const handleTemplateSelect = (template) => {
    setCanvasSize({ width: template.width, height: template.height });
    setLayers([]);
    setSelectedLayer(null);
    saveToHistory([]);
    setHasChosenTemplate(true);
  };

  // Fit to screen wrapper
  const handleFitToScreenWrapper = useCallback(() => {
    handleFitToScreen(canvasAreaRef, canvasSize);
  }, [handleFitToScreen, canvasSize]);

  // Image settings handler
  const handleImageSettingsChange = (property, value) => {
    if (!selectedLayer) return;
    const layer = layers.find(l => l.id === selectedLayer);
    if (layer && layer.type === 'image') {
      const newLayers = layers.map(l =>
        l.id === selectedLayer ? { ...l, [property]: value } : l
      );
      setLayers(newLayers);
      saveToHistory(newLayers);
    }
  };

  // Generic effects handler
  const handleEffectChange = (property, value) => {
    if (!selectedLayer) return;
    const layer = layers.find(l => l.id === selectedLayer);
    if (layer) {
      const newLayers = layers.map(l =>
        l.id === selectedLayer ? { ...l, [property]: value } : l
      );
      setLayers(newLayers);
      saveToHistory(newLayers);
    }
  };

  // Canvas click handler
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      setSelectedLayer(null);
    }
  };

  // Drawing mouse handlers are provided by useDrawing hook
  // No need to redeclare handleDrawingMouseDown

  // Return JSX
  return (
    <div className="flex h-screen bg-gray-50 font-sans relative z-[1] ml-0 pl-0 w-full max-w-full overflow-hidden">

      {/* Left Sidebar */}
      <LeftCanvasSidebar
        toggleSection={toggleSection}
        openSections={openSections}
        hoveredOption={hoveredOption}
        setHoveredOption={setHoveredOption}
        selectedTool={selectedTool}
        handleToolSelect={handleToolSelect}
        handleAddElement={handleAddElement}
        setSelectedTool={setSelectedTool}
        fileInputRef={fileInputRef}
        handleImageUpload={handleImageUpload}
        uploadedImages={uploadedImages}
        handleLayerDuplicate={handleLayerDuplicate}
        handleAIGeneratedImage={handleAIGeneratedImage}
        imageSettings={imageSettings}
        templates={templates}
        handleTemplateSelect={handleTemplateSelect}
        drawingSettings={drawingSettings}
        handleDrawingSettingsChange={handleDrawingSettingsChange}
        canvasSize={canvasSize}
        setCanvasSize={setCanvasSize}
        onCanvasBgColorChange={setCanvasBgColor}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0 overflow-hidden transition-all duration-300 relative">
        {/* Text Formatting Toolbar - Sticky positioned, always shows */}
        <div className="sticky top-0 left-0 right-0 z-[99] bg-white">
          <TextFormattingToolbar
            selectedLayer={selectedLayer}
            layer={selectedLayer && layers.find(l => l.id === selectedLayer)?.type === 'text' ? layers.find(l => l.id === selectedLayer) : null}
            textSettings={textSettings}
            onTextSettingsChange={handleTextSettingsChange}
            onTextColorChange={handleTextColorChange}
            onTextAlignChange={handleTextAlignChange}
            onToggleBold={handleToggleBold}
            onToggleItalic={handleToggleItalic}
            onToggleUnderline={handleToggleUnderline}
            onToggleStrikethrough={handleToggleStrikethrough}
            onToggleCase={handleToggleCase}
            onEffects={handleEffects}
            onAnimate={handleAnimate}
            onPosition={handlePosition}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onSave={handleSave}
            onExport={handleExport}
            onDuplicate={handleDuplicateSelected}
            hasSelection={!!selectedLayer}
          />
        </div>

        {/* Image Editing Toolbar - Sticky positioned, shows only for image layers */}
        {selectedLayer && layers.find(l => l.id === selectedLayer)?.type === 'image' && (
          <div className="sticky top-0 left-0 right-0 z-[99] bg-white">
            <ImageEditingToolbar
              selectedLayer={selectedLayer}
              layer={layers.find(l => l.id === selectedLayer)}
              onEdit={handleImageEdit}
              onEraser={handleImageEraser}
              onClear={handleImageClear}
              onAlign={handleImageAlign}
              onDraw={handleImageDraw}
              onFlip={handleImageFlip}
              onAnimate={handleAnimate}
              onPosition={handlePosition}
            />
          </div>
        )}

        {/* Canvas Area - scrollable container with all pages */}
        <div className="flex-1 flex flex-col justify-start py-6 items-center min-h-0 h-full overflow-y-auto overflow-x-hidden">
          {pages.map((page, pageIndex) => {
            const isActivePage = pageIndex === currentPageIndex;
            const pageRefs = getOrCreateRefs(page.id);
            const pageLayers = isActivePage ? layers : (page.layers || []);

            return (
              <div key={page.id} className="w-full flex justify-center items-center mb-16 last:mb-6 px-4">
                <div className="flex justify-center items-center">
                  <CanvasArea
                    canvasAreaRef={pageRefs.canvasAreaRef}
                    contentWrapperRef={pageRefs.contentWrapperRef}
                    canvasRef={isActivePage ? canvasRef : { current: null }}
                    canvasSize={canvasSize}
                    zoom={zoom}
                    showGrid={showGrid}
                    pan={pan}
                    handleCanvasClick={isActivePage ? handleCanvasClick : () => { }}
                    handleDrawingMouseDown={isActivePage ? handleDrawingMouseDown : () => { }}
                    handleCanvasMouseMove={isActivePage ? handleCanvasMouseMove : () => { }}
                    handleCanvasMouseLeave={isActivePage ? handleCanvasMouseLeave : () => { }}
                    layers={pageLayers}
                    hasChosenTemplate={hasChosenTemplate}
                    templates={templates}
                    handleTemplateSelect={handleTemplateSelect}
                    selectedLayer={isActivePage ? selectedLayer : null}
                    selectedTool={selectedTool}
                    handleLayerSelect={isActivePage ? handleLayerSelect : () => { }}
                    handleMouseDown={isActivePage ? handleMouseDown : () => { }}
                    handleResizeMouseDown={isActivePage ? handleResizeMouseDown : () => { }}
                    handleRotateMouseDown={isActivePage ? handleRotateMouseDown : () => { }}
                    handleTextContentChange={isActivePage ? handleTextContentChange : () => { }}
                    drawingSettings={drawingSettings}
                    currentPath={currentPath}
                    isMouseOverCanvas={isMouseOverCanvas}
                    mousePosition={mousePosition}
                    scrollMetrics={isActivePage ? scrollMetrics : { scrollLeft: 0, scrollTop: 0, scrollWidth: 0, scrollHeight: 0, clientWidth: 0, clientHeight: 0 }}
                    SCROLLER_MARGIN={SCROLLER_MARGIN}
                    SCROLLER_THICKNESS={SCROLLER_THICKNESS}
                    handleHTrackClick={isActivePage ? handleHTrackClick : () => { }}
                    handleHThumbMouseDown={isActivePage ? handleHThumbMouseDown : () => { }}
                    handleVTrackClick={isActivePage ? handleVTrackClick : () => { }}
                    handleVThumbMouseDown={isActivePage ? handleVThumbMouseDown : () => { }}
                    getShapeDisplayProps={getShapeDisplayProps}
                    handleQuickColorChange={isActivePage ? handleQuickColorChange : () => { }}
                    handleLayerDuplicate={isActivePage ? handleLayerDuplicate : () => { }}
                    handleLayerDelete={isActivePage ? handleLayerDelete : () => { }}
                    handleEnhanceText={isActivePage ? handleEnhanceText : () => { }}
                    isEnhancingText={isEnhancingText}
                    getLayerPrimaryColor={getLayerPrimaryColor}
                    setSelectedLayer={isActivePage ? setSelectedLayer : () => { }}
                    canvasBgColor={canvasBgColor}
                    handleUndo={isActivePage ? handleUndo : () => { }}
                    handleRedo={isActivePage ? handleRedo : () => { }}
                    pageId={page.id}
                    onPageRemove={handlePageRemove}
                    canRemovePage={pages.length > 1}
                  />
                </div>
              </div>
            );
          })}

        </div>

        {/* Bottom Toolbar */}
        <BottomToolbar
          zoom={zoom}
          setZoom={setZoom}
          currentPage={currentPageIndex + 1}
          totalPages={pages.length}
          onAddPage={handleAddPage}
          onPageChange={handlePageChange}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onMaximize={handleMaximize}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          handleZoomOut={handleZoomOut}
          handleZoomIn={handleZoomIn}
          handleZoomReset={handleZoomReset}
          handleFitToScreen={handleFitToScreenWrapper}
          onSave={handleSave}
          onExport={handleExport}
          onDuplicate={handleDuplicateSelected}
          hasSelection={!!selectedLayer}
          canvasSize={canvasSize}
          selectedTool={selectedTool}
        />

      </div>

      <SaveExportModal
        open={isSaveModalOpen}
        onClose={() => !isExporting && setIsSaveModalOpen(false)}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        exportQuality={exportQuality}
        setExportQuality={setExportQuality}
        includeProjectFile={includeProjectFile}
        setIncludeProjectFile={setIncludeProjectFile}
        isExporting={isExporting}
        onDownload={handleDownloadExport}
        onSaveWorksheet={handleSaveWorksheetToLocation}
      />
      {/* Right Sidebar */}
      {
        layers.length > 0 && (
          <RightSidebar
            isRightSidebarCollapsed={isRightSidebarCollapsed}
            setIsRightSidebarCollapsed={setIsRightSidebarCollapsed}
            layers={layers}
            selectedLayer={selectedLayer}
            handleLayerSelect={handleLayerSelect}
            handleLayerToggleVisibility={handleLayerToggleVisibility}
            handleLayerDuplicate={handleLayerDuplicate}
            handleLayerDelete={handleLayerDelete}
            textSettings={textSettings}
            handleTextContentChange={handleTextContentChange}
            handleTextSettingsChange={handleTextSettingsChange}
            shapeSettings={shapeSettings}
            handleShapeSettingsChange={handleShapeSettingsChange}
            imageSettings={imageSettings}
            handleImageSettingsChange={handleImageSettingsChange}
            drawingSettings={drawingSettings}
            handleDrawingSettingsChange={handleDrawingSettingsChange}
            setSelectedTool={setSelectedTool}
            handleLayerDragStart={handleLayerDragStart}
            handleLayerDragOver={handleLayerDragOver}
            handleLayerDragLeave={handleLayerDragLeave}
            handleLayerDrop={handleLayerDrop}
            handleLayerDragEnd={handleLayerDragEnd}
            draggedLayer={draggedLayer}
            dragOverIndex={dragOverIndex}
            isLayerDragging={isLayerDragging}
            renamingLayerId={renamingLayerId}
            setRenamingLayerId={setRenamingLayerId}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            startRenameLayer={startRenameLayer}
            commitRenameLayer={commitRenameLayer}
            handleEffectChange={handleEffectChange}
            handleEnhanceText={handleEnhanceText}
            isEnhancingText={isEnhancingText}
            isHeading={isHeading}
            setIsHeading={setIsHeading}
            fileInputRef={fileInputRef}
            uploadedImages={uploadedImages}
            strokeColorInputRef={strokeColorInputRef}
            textColorInputRef={textColorInputRef}
          />
        )
      }

      {showStyleModal && (
        <TextStyleModal
          text={layers.find(l => l.id === selectedLayer && l.type === 'text')?.text || ''}
          onClose={() => setShowStyleModal(false)}
          onAddToCanvas={handleAddStyledImageToCanvas}
        />
      )}
    </div>
  );
};

export default CanvaEditor;

