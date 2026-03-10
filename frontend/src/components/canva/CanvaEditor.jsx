import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FiMove, FiChevronDown, FiChevronRight, FiFilter, FiZap, FiCrop } from 'react-icons/fi';
import api from '../../services/api';
import { getFilterCSS, getShadowCSS, hexToRgba } from '../../utils/styleUtils';
import { isHeadingLayer } from '../../utils/textUtils';
import EditingToolbar from './components/EditingToolbar';
import BottomToolbar from './components/BottomToolbar';
import SaveExportModal from './SaveExportModal';
import TextStyleModal from './TextStyleModal';
import RightSidebar from './components/RightSidebar';
import CanvasArea from './canvas/CanvasArea';
import LeftCanvasSidebar from './components/LeftCanvasSidebar';
import ProjectNameModal from './components/ProjectNameModal';

// Import hooks
import { useAuth } from '../../contexts/AuthContext';
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
import { GRADIENTS } from './components/BackgroundColor';
import { saveImage, updateImage, updateImageVisibility, exportImage, uploadTemporaryImage } from '@/services/imageEditor/imageApi';

const CanvaEditor = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Core state
  const [selectedTool, setSelectedTool] = useState('select');
  const [layers, setLayers] = useState([]);
  const [canvasSize, setCanvasSize] = useState(initialCanvasSize);
  const [templates] = useState(initialTemplates);
  const [textSettings, setTextSettings] = useState(initialTextSettings);
  const [shapeSettings, setShapeSettings] = useState(initialShapeSettings);
  const [imageSettings, setImageSettings] = useState(initialImageSettings);
  const [openSections, setOpenSections] = useState(initialOpenSections);
  const [hasChosenTemplate, setHasChosenTemplate] = useState(true);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [canvasBgColor, setCanvasBgColor] = useState('#82c787ff');
  const [canvasBgImage, setCanvasBgImage] = useState(null);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [isHeading, setIsHeading] = useState(false);
  const [tempBgState, setTempBgState] = useState(null);
  const [projectName, setProjectName] = useState('Untitled Design');
  const [isProjectNameModalOpen, setIsProjectNameModalOpen] = useState(false);

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
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [cropState, setCropState] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState(initialTemplates[0]?.id || 'default');

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
    resetHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory(layers);

  // Track changes for "Save Changes" prompt
  useEffect(() => {
    // If we're at index 0, it's either just loaded or just reset
    if (historyIndex > 0) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [historyIndex]);

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
  } = useCanvasTransforms(80, { x: 0, y: 0 });

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
    handleCanvasMouseMove: handleCanvasMouseMoveBase,
    handleCanvasMouseLeave,
    handleCanvasClick: handleCanvasClickBase,
    alignmentGuides
  } = useCanvasInteractions(
    layers,
    setLayers,
    selectedLayer,
    setSelectedLayer,
    selectedTool,
    getCanvasPoint,
    saveToHistory,
    canvasSize
  );

  // 🔴 Wrapper for handleCanvasMouseMove to handle drawing
  const handleCanvasMouseMoveWrapper = useCallback((e) => {
    handleCanvasMouseMoveBase(e);

    // Handle Drawing
    if (drawingSettings.isDrawing) {
      const { x, y } = getCanvasPoint(e.clientX, e.clientY);

      if (selectedTool === 'eraser') {
        handleEraserAction(x, y);
      } else {
        addPointToPath({ x, y });
      }
    }
  }, [handleCanvasMouseMoveBase, drawingSettings.isDrawing, selectedTool, getCanvasPoint, handleEraserAction, addPointToPath]);

  // 🔴 Finish drawing on global mouse up
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (drawingSettings.isDrawing) {
        finishDrawing();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [drawingSettings.isDrawing, finishDrawing]);

  useEffect(() => {
    console.log("Logged in user:", user);
  }, [user]);


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
  useProjectLoader(setLayers, setCanvasSize, setZoom, setPan, setCanvasBgColor, setCanvasBgImage, setProjectName);

  // Determine whether this project was opened via import-prefill (treat as new)
  const [isPrefillImport, setIsPrefillImport] = useState(false);
  useEffect(() => {
    try {
      if (projectId) {
        const flag = typeof window !== 'undefined' && sessionStorage.getItem(`prefill_import_flag_${projectId}`);
        setIsPrefillImport(!!flag);
      }
    } catch (e) { }
  }, [projectId]);

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

          const defaultHeading = {
            id: Date.now(),
            type: 'text',
            name: 'Heading',
            text: 'Add a heading',
            x: centerX,
            y: centerY,
            width: 300,
            height: 80,
            ...textSettings,
            fontSize: 32,
            fontWeight: '700',
            visible: true,
            locked: false,
            rotation: 0,
          };

          setLayers([defaultHeading]);
          hasInitializedRef.current = true;
          resetHistory([defaultHeading]);
          setHasUnsavedChanges(false);
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
  }, [layers.length, handleAddElement, resetHistory, textSettings, canvasSize, projectId]);

  // Keep right sidebar open when text layer is selected (only on selection, not on every state change)
  useEffect(() => {
    if (selectedLayer) {
      const layer = layers.find(l => l.id === selectedLayer);
      if (layer && layer.type === 'text' && isRightSidebarCollapsed) {
        setIsRightSidebarCollapsed(false);
      }
    }
    // Only run when selectedLayer or layers change, not when isRightSidebarCollapsed changes
    // This allows manual collapse/expand to work without interference
  }, [selectedLayer, layers]);

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
    // If clicking the same tool again, toggle it off (set to 'select' mode)
    if (selectedTool === toolId) {
      setSelectedTool('select');
      setSelectedLayer(null);
      return;
    }

    setSelectedTool(toolId);
    setSelectedLayer(null);
    // Set drawing mode when selecting drawing tools
    if (['brush', 'pen', 'eraser'].includes(toolId)) {
      setDrawingSettings(prev => ({
        ...prev,
        drawingMode: toolId,
        // Set default sizes based on tool
        brushSize: toolId === 'brush' ? 12 : (toolId === 'pen' ? 4 : (toolId === 'eraser' ? 16 : prev.brushSize))
      }));
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
      // Expand right sidebar if it's collapsed when selecting text
      if (isRightSidebarCollapsed) {
        setIsRightSidebarCollapsed(false);
      }
    }
  }, [handleLayerSelectBase, layers, isRightSidebarCollapsed]);

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
  const handleSave = (title) => {
    if (!user) {
      alert("Please login to save your design");
      return;
    }

    // If caller provided a title (e.g. from ProjectNameModal), use it.
    if (title && typeof title === 'string') {
      confirmSave(title);
      return;
    }

    // If this is an existing project, save immediately using current project name
    if (projectId) {
      confirmSave(projectName);
      return;
    }

    // No title and not an existing project: open project-name modal (fallback)
    setIsProjectNameModalOpen(true);
  };

  // Assuming updateImage and updateImageVisibility are imported from a service file
  // import { updateImage, updateImageVisibility } from '../services/api'; // Add this import at the top of your file

  const confirmSave = async (title) => {
    setIsProjectNameModalOpen(false);
    setProjectName(title);

    try {
      // Attach canvas metadata to each layer
      const layersWithCanvasMeta = layers.map(l => ({
        ...l,
        canvasBgColor,
        canvasBgImage,
        zoom,
        pan,
        canvasSize
      }));

      // Convert any base64 image layers to temporary URLs before saving
      const processedLayers = await Promise.all(layersWithCanvasMeta.map(async (lay) => {
        try {
          // detect common base64/data URLs
          const src = lay?.src || lay?.url || lay?.image || '';
          if (typeof src === 'string' && src.startsWith('data:')) {
            const payload = {
              userId: user?._id || user?.id || '',
              base64Image: src,
              serviceId: lay.id || `srv-${Date.now()}`,
            };
            const resp = await uploadTemporaryImage(payload);
            if (resp && resp.url) {
              // replace base64 with returned URL
              return { ...lay, src: resp.url, url: resp.url, imageUrl: resp.url };
            }
          }
        } catch (e) {
          console.error('Failed to upload temporary image for layer', lay.id, e);
        }
        return lay;
      }));

      const updatePayload = {
        title: title,
        data: {
          layer: processedLayers,
          canvasSize
        }
      };

      console.log("Saving design JSON:", JSON.stringify(updatePayload, null, 2));

      if (projectId) {
        await updateImage(projectId, updatePayload);
        toast.success("Design updated successfully!");
      } else {
        const newProjectPayload = {
          userId: user?._id || user?.id,
          title: title,
          isPublic: false,
          data: {
            layer: processedLayers,
            canvasSize
          }
        };
        const result = await saveImage(newProjectPayload);
        console.log("Saved response:", result);

        toast.success("Design saved successfully!");

        if (result && (result.id || result._id)) {
          navigate(`/canva-clone/${result.id || result._id}`);
        }
      }

      resetHistory(layers);
      setHasUnsavedChanges(false);

    } catch (error) {
      console.error("Failed to save design:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error saving design. Please try again.";
      alert(errorMessage);
    }
  };

  // Duplicate currently selected layer (if any)
  const handleDuplicateSelected = () => {
    if (!selectedLayer) return;
    handleLayerDuplicate(selectedLayer);
  };

  // Export function wrapper
  const exportCanvasAsImageWrapper = async (format = 'png', quality = 0.92) => {
    return await exportCanvasAsImage(layers, canvasSize, format, quality, canvasBgColor, canvasBgImage);
  };

  const handleDownloadExport = async (format) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const fmt = format || exportFormat;

      // If project is saved (has an id), call backend export endpoint to get server-generated file
      if (projectId) {
        try {
          const blob = await exportImage(projectId, fmt);

          // If server returned JSON (error), blob.type will be application/json — handle gracefully
          if (blob && blob.type && blob.type.includes('application/json')) {
            const text = await blob.text();
            let msg = 'Export failed';
            try {
              const parsed = JSON.parse(text);
              msg = parsed.message || parsed.error || JSON.stringify(parsed);
            } catch (e) {
              msg = text;
            }
            toast.error(msg);
          } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const ext = fmt === 'jpeg' ? 'jpg' : fmt;
            link.href = url;
            link.download = `design-${timestamp}.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
          return;
        } catch (err) {
          console.error('Backend export failed, falling back to client export:', err);
          // fallthrough to client-side export
        }
      }

      // Fallback: client-side export (works for unsaved/new projects)
      const dataUrl = await exportCanvasAsImageWrapper(fmt, exportQuality);
      if (!dataUrl) return;
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const ext = fmt === 'jpeg' ? 'jpg' : (fmt === 'webp' ? 'webp' : fmt === 'jpg' ? 'jpg' : fmt);
      link.download = `design-${timestamp}.${ext}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Optionally persist and download project file (worksheet)
      try {
        const layersWithCanvasMeta = layers.map(l => ({
          ...l,
          canvasBgColor,
          canvasBgImage,
          zoom: 100,
          pan: { x: 0, y: 0 },
          canvasSize
        }));
        const design = { layers: layersWithCanvasMeta, canvasSize, savedAt: Date.now() };
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
      const layersWithCanvasMeta = layers.map(l => ({
        ...l,
        canvasBgColor,
        canvasBgImage,
        zoom,
        pan,
        canvasSize
      }));
      const design = { layers: layersWithCanvasMeta, canvasSize, savedAt: Date.now() };
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



  const handleApplyDesignTemplate = (template) => {
    // Set canvas size
    const newSize = {
      width: template.width,
      height: template.height
    };
    setCanvasSize(newSize);

    // Add layers with unique IDs
    // Get random image if template has image list
    let selectedImage = null;

    if (template.images && template.images.length > 0) {
      selectedImage =
        template.images[Math.floor(Math.random() * template.images.length)];
    }

    const newLayers = template.layers.map(layer => {
      if (layer.type === "image" && selectedImage) {
        return {
          ...layer,
          src: selectedImage,
          id: Date.now() + Math.random(),
          visible: true,
          locked: false,
          rotation: 0
        };
      }

      return {
        ...layer,
        id: Date.now() + Math.random(),
        visible: true,
        locked: false,
        rotation: 0
      };
    });

    setLayers(newLayers);
    resetHistory(newLayers);
    setHasUnsavedChanges(false);
    // Find matching template if any to set as active
    const matchingTemplate = templates.find(t => t.width === newSize.width && t.height === newSize.height);
    if (matchingTemplate) setActiveTemplateId(matchingTemplate.id);

    setSelectedLayer(null);
    setHasChosenTemplate(true);
    hasInitializedRef.current = true;

    // Ensure a heading exists in the applied template, if not add one
    const hasHeading = newLayers.some(l => l.type === 'text' && (l.name === 'Heading' || l.fontSize >= 30));
    if (!hasHeading) {
      const centerX = Math.max(100, (newSize.width - 300) / 2);
      const defaultHeading = {
        id: Date.now() + 1,
        type: 'text',
        name: 'Heading',
        text: 'Add a heading',
        x: centerX,
        y: 50,
        width: 300,
        height: 80,
        ...textSettings,
        fontSize: 32,
        fontWeight: '700',
        visible: true,
        locked: false,
        rotation: 0,
      };
      const layersWithHeading = [...newLayers, defaultHeading];
      setLayers(layersWithHeading);
      resetHistory(layersWithHeading);
    }

    // Auto-fit to screen after small delay to allow DOM to catch up
    setTimeout(() => {
      const pageId = pages[currentPageIndex]?.id || 1;
      const ref = canvasAreaRefs.current[pageId];
      if (ref) {
        handleFitToScreen(ref, newSize);
      }
    }, 50);
  };


  const handlePageChange = useCallback((index) => {
    if (index >= 0 && index < pages.length && index !== currentPageIndex) {
      // Save current page layers
      const updatedPages = [...pages];
      updatedPages[currentPageIndex] = { ...pages[currentPageIndex], layers: [...layers] };
      setPages(updatedPages);

      // Load new page layers
      isLoadingPageRef.current = true;
      const newLayers = pages[index].layers || [];
      setLayers(newLayers);
      resetHistory(newLayers);
      setHasUnsavedChanges(false);
      setSelectedLayer(null);
      setCurrentPageIndex(index);
    }
  }, [pages, currentPageIndex, layers, resetHistory, setHasUnsavedChanges]);

  const handleMaximize = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsMaximized(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsMaximized(false);
      }
    }
  }, []);

  // Add styled image to canvas (robust: validates URL, preloads to get dimensions)
  const handleAddStyledImageToCanvas = (imageUrl) => {
    try {
      if (!imageUrl || typeof imageUrl !== 'string') {
        console.error('handleAddStyledImageToCanvas: invalid imageUrl', imageUrl);
        return;
      }

      const id = Date.now().toString();

      const addLayer = (width = 200, height = 200) => {
        const newLayer = {
          id,
          type: 'image',
          src: imageUrl,
          x: Math.max(0, Math.round(canvasSize.width / 2 - width / 2)),
          y: Math.max(0, Math.round(canvasSize.height / 2 - height / 2)),
          width: Math.round(width),
          height: Math.round(height),
          opacity: 100,
          brightness: 100,
          contrast: 100,
          blur: 0,
          cornerRadius: 0,
          strokeWidth: 0,
          strokeColor: '#000000',
          shadows: { enabled: false },
          visible: true,
          locked: false,
          rotation: 0,
          name: 'AI Styled Image'
        };

        setLayers(prev => {
          const newLayers = [...prev, newLayer];
          saveToHistory(newLayers);
          return newLayers;
        });
        setSelectedLayer(id);
      };

      // Try to preload the image to get natural dimensions
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const maxWidth = Math.min(canvasSize.width * 0.6, img.naturalWidth || 200);
          const maxHeight = Math.min(canvasSize.height * 0.6, img.naturalHeight || 200);
          let width = img.naturalWidth || 200;
          let height = img.naturalHeight || 200;

          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(100, width * scale);
            height = Math.max(100, height * scale);
          }

          if (width < 100) {
            const scale = 100 / width;
            width = 100;
            height = Math.round(height * scale);
          }
          if (height < 100) {
            const scale = 100 / height;
            height = 100;
            width = Math.round(width * scale);
          }

          addLayer(width, height);
        } catch (err) {
          console.error('Error sizing preloaded image, falling back to defaults', err);
          addLayer();
        }
      };
      img.onerror = (err) => {
        console.warn('Failed to preload styled image, adding with default size', err);
        addLayer();
      };
      img.src = imageUrl;
    } catch (err) {
      console.error('handleAddStyledImageToCanvas error', err);
    }
  };

  // Shape settings handler
  const handleShapeSettingsChange = useCallback((propertyOrUpdates, value) => {
    if (!selectedLayer) return;

    const layer = layers.find(l => l.id === selectedLayer);
    if (!layer || layer.type !== 'shape') return;

    let updates = {};

    if (typeof propertyOrUpdates === 'object' && propertyOrUpdates !== null) {
      updates = propertyOrUpdates;
    } else {
      updates = { [propertyOrUpdates]: value };
    }

    const newLayers = layers.map(l =>
      l.id === selectedLayer ? { ...l, ...updates } : l
    );

    setLayers(newLayers);

    setShapeSettings(prev => ({
      ...prev,
      ...updates
    }));

    saveToHistory(newLayers);
  }, [selectedLayer, layers, setLayers, saveToHistory, setShapeSettings]);
  // Image upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      e.target.value = ''; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target.result;

      // Validate that we got a valid data URL
      if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
        alert('Invalid image file. Please try a different file.');
        e.target.value = '';
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Validate image loaded successfully
        if (!img.naturalWidth || !img.naturalHeight) {
          alert('Invalid image dimensions. Please try a different file.');
          e.target.value = '';
          return;
        }

        // Calculate dimensions to fit on canvas while maintaining aspect ratio
        const maxWidth = Math.min(canvasSize.width * 0.6, img.naturalWidth);
        const maxHeight = Math.min(canvasSize.height * 0.6, img.naturalHeight);

        let width = img.naturalWidth;
        let height = img.naturalHeight;

        // Scale down if image is too large
        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width = width * scale;
          height = height * scale;
        }

        // Ensure minimum size
        if (width < 100) {
          const scale = 100 / width;
          width = 100;
          height = height * scale;
        }
        if (height < 100) {
          const scale = 100 / height;
          height = 100;
          width = width * scale;
        }

        const newImage = {
          id: Date.now().toString(),
          type: 'image',
          src: imageDataUrl,
          x: Math.max(0, (canvasSize.width - width) / 2),
          y: Math.max(0, (canvasSize.height - height) / 2),
          width: Math.round(width),
          height: Math.round(height),
          opacity: 100,
          brightness: 100,
          contrast: 100,
          blur: 0,
          cornerRadius: 0,
          strokeWidth: 0,
          strokeColor: '#000000',
          shadows: { enabled: false },
          visible: true,
          locked: false,
          rotation: 0,
          name: file.name || 'Uploaded Image'
        };

        // Update layers state
        setLayers(prev => {
          const newLayers = [...prev, newImage];
          // Save to history with the new layers array
          saveToHistory(newLayers);
          return newLayers;
        });

        setSelectedLayer(newImage.id);

        // Add to uploaded images for the "Recently Uploaded" section
        setUploadedImages(prev => {
          // Keep only the last 10 uploaded images
          const updated = [newImage, ...prev.filter(img => img.id !== newImage.id)].slice(0, 10);
          return updated;
        });

        console.log('Image uploaded successfully:', {
          id: newImage.id,
          type: newImage.type,
          srcLength: newImage.src.length,
          srcPreview: newImage.src.substring(0, 50) + '...',
          dimensions: `${newImage.width}x${newImage.height}`,
          position: `(${Math.round(newImage.x)}, ${Math.round(newImage.y)})`,
          visible: newImage.visible,
          canvasSize: `${canvasSize.width}x${canvasSize.height}`
        });
      };

      img.onerror = () => {
        console.error('Image load error:', { file: file.name, type: file.type, size: file.size });
        alert('Failed to load image. The file may be corrupted. Please try a different file.');
        e.target.value = ''; // Reset input
      };

      img.src = imageDataUrl;
    };

    reader.onerror = () => {
      toast.error('Failed to read image file. Please try again.');
      e.target.value = ''; // Reset input
    };

    reader.readAsDataURL(file);

    // Reset input to allow uploading the same file again
    e.target.value = '';
  };

  // AI generated image handler
  const handleAIGeneratedImage = (newImage) => {
    setLayers(prev => {
      const newLayers = [...prev, newImage];
      saveToHistory(newLayers);
      return newLayers;
    });
    setSelectedLayer(newImage.id);
  };

  // -----------------------------
  // GIF Emoji Handler (NEW)


  const handleAddSticker = useCallback((src) => {
    const newLayer = {
      id: Date.now().toString(),
      type: 'image',
      src: src,
      x: canvasSize.width / 2 - 60,
      y: canvasSize.height / 2 - 60,
      width: 120,
      height: 120,
      opacity: 100,
      rotation: 0,
      brightness: 100,
      contrast: 100,
      blur: 0,
      cornerRadius: 0,
      strokeWidth: 0,
      strokeColor: '#000000',
      shadows: { enabled: false },
      visible: true,
      locked: false,
      name: 'Sticker'
    };

    setLayers(prev => {
      const newLayers = [...prev, newLayer];
      saveToHistory(newLayers);
      return newLayers;
    });

    setSelectedLayer(newLayer.id);
  }, [canvasSize, saveToHistory]);


  // Handler to add uploaded image from "Recently Uploaded" section to canvas
  const handleAddUploadedImage = useCallback((uploadedImage) => {
    if (!uploadedImage || !uploadedImage.src) {
      console.error('Invalid image data');
      return;
    }

    // Create a new image to get dimensions
    const img = new Image();
    img.onload = () => {
      // Calculate dimensions to fit on canvas while maintaining aspect ratio
      const maxWidth = Math.min(canvasSize.width * 0.6, img.naturalWidth);
      const maxHeight = Math.min(canvasSize.height * 0.6, img.naturalHeight);

      let width = img.naturalWidth;
      let height = img.naturalHeight;

      // Scale down if image is too large
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height);
        width = width * scale;
        height = height * scale;
      }

      // Ensure minimum size
      if (width < 100) {
        const scale = 100 / width;
        width = 100;
        height = height * scale;
      }
      if (height < 100) {
        const scale = 100 / height;
        height = 100;
        width = width * scale;
      }

      // Create new layer with new ID (so it's a new instance, not a duplicate)
      const newImage = {
        id: Date.now().toString(),
        type: 'image',
        src: uploadedImage.src,
        x: Math.max(0, (canvasSize.width - width) / 2),
        y: Math.max(0, (canvasSize.height - height) / 2),
        width: Math.round(width),
        height: Math.round(height),
        opacity: uploadedImage.opacity || 100,
        brightness: uploadedImage.brightness || 100,
        contrast: uploadedImage.contrast || 100,
        blur: uploadedImage.blur || 0,
        cornerRadius: uploadedImage.cornerRadius || 0,
        strokeWidth: uploadedImage.strokeWidth || 0,
        strokeColor: uploadedImage.strokeColor || '#000000',
        shadows: uploadedImage.shadows || { enabled: false },
        visible: true,
        locked: false,
        rotation: 0,
        name: uploadedImage.name || 'Uploaded Image'
      };

      // Add to layers
      setLayers(prev => {
        const newLayers = [...prev, newImage];
        saveToHistory(newLayers);
        return newLayers;
      });

      setSelectedLayer(newImage.id);
    };

    img.onerror = () => {
      console.error('Failed to load image from uploaded images');
      alert('Failed to load image. Please try uploading it again.');
    };

    img.src = uploadedImage.src;
  }, [canvasSize, saveToHistory]);

  // Template selection handler
  const handleTemplateSelect = (template) => {
    // Clear previous layers/text
    setLayers([]);
    resetHistory([]);
    setHasUnsavedChanges(false);

    if (template.name === 'Default Canvas') {
      resetEditorToInitialState();
      setActiveTemplateId(template.id);
      return;
    }

    // Only change canvas size
    const newSize = {
      width: template.width,
      height: template.height
    };
    setCanvasSize(newSize);

    setActiveTemplateId(template.id);
    setSelectedLayer(null);
    setHasChosenTemplate(true);

    // Add default heading centered
    const centerX = Math.max(100, (newSize.width - 300) / 2);
    const centerY = (newSize.height > 400) ? 100 : 50;

    const defaultHeading = {
      id: Date.now(),
      type: 'text',
      name: 'Heading',
      text: 'Add a heading',
      x: centerX,
      y: centerY,
      width: 300,
      height: 80,
      ...textSettings,
      fontSize: 32,
      fontWeight: '700',
      visible: true,
      locked: false,
      rotation: 0,
    };

    const defaultDate = {
      id: Date.now() + 1,
      type: 'text',
      name: 'Current Date',
      text: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      x: newSize.width - 160,
      y: newSize.height - 40,
      width: 150,
      height: 30,
      fontSize: 12,
      color: '#ffffff',
      textAlign: 'right',
      opacity: 70,
      visible: true,
      locked: false,
      rotation: 0,
    };

    setLayers([defaultHeading, defaultDate]);
    resetHistory([defaultHeading, defaultDate]);

    // Auto-fit to screen
    setTimeout(() => {
      const pageId = pages[currentPageIndex]?.id || 1;
      const ref = canvasAreaRefs.current[pageId];
      if (ref) {
        handleFitToScreen(ref, newSize);
      }
    }, 50);
  };

  // Fit to screen wrapper
  const handleFitToScreenWrapper = useCallback(() => {
    handleFitToScreen(canvasAreaRef, canvasSize);
  }, [handleFitToScreen, canvasSize]);

  // Image settings handler
  const handleImageSettingsChange = (property, value) => {
    if (!selectedLayer) return;

    setLayers(prevLayers => {
      const updatedLayers = prevLayers.map(layer =>
        layer.id === selectedLayer && layer.type === 'image'
          ? { ...layer, [property]: value }
          : layer
      );

      // ⚠️ IMPORTANT: call history AFTER state calculation
      saveToHistory(updatedLayers);

      return updatedLayers;
    });
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
    e.stopPropagation();
    // If the click reached here, it wasn't swallowed by a layer, so it's a background click.
    setSelectedLayer(null);
  };

  // 🔴 Handle clicking outside canvas to deselect drawing tools and layers
  const handleOutsideClick = (e) => {
    // Deselect layer when clicking outside
    setSelectedLayer(null);

    if (['brush', 'pen', 'eraser'].includes(selectedTool)) {
      setSelectedTool('select');
      setDrawingSettings(prev => ({ ...prev, isDrawing: false }));
    }
  };

  const resetEditorToInitialState = useCallback(() => {
    // Reset canvas
    setCanvasSize(initialCanvasSize);
    setZoom(80);
    setPan({ x: 0, y: 0 });

    const centerX = Math.max(100, (initialCanvasSize.width - 300) / 2);
    const centerY = 100;
    const defaultHeading = {
      id: Date.now(),
      type: 'text',
      name: 'Heading',
      text: 'Add a heading',
      x: centerX,
      y: centerY,
      width: 300,
      height: 80,
      ...textSettings,
      fontSize: 32,
      fontWeight: '700',
      visible: true,
      locked: false,
      rotation: 0,
    };

    const defaultDate = {
      id: Date.now() + 1,
      type: 'text',
      name: 'Current Date',
      text: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      x: initialCanvasSize.width - 160,
      y: initialCanvasSize.height - 40,
      width: 150,
      height: 30,
      fontSize: 12,
      color: '#ffffff',
      textAlign: 'right',
      opacity: 70,
      visible: true,
      locked: false,
      rotation: 0,
    };

    // Reset layers & pages with a default heading and date
    setLayers([defaultHeading, defaultDate]);
    setPages([{ id: Date.now() + 2, layers: [defaultHeading, defaultDate] }]);
    setCurrentPageIndex(0);

    // Reset selections & tools
    setSelectedLayer(null);
    setSelectedTool('select');

    // Reset UI state
    setHasChosenTemplate(false);
    setIsRightSidebarCollapsed(false);
    setIsRightSidebarOpen(false);
    setOpenSections(initialOpenSections);

    // Reset background
    setCanvasBgColor(GRADIENTS[0].value);
    setCanvasBgImage(null);

    // 🔑 Mark as initialized
    hasInitializedRef.current = true;

    // Reset history with the initial layer as the base state
    resetHistory([defaultHeading, defaultDate]);
    setHasUnsavedChanges(false);

  }, [setZoom, setPan, resetHistory, textSettings]);


  // Drawing mouse handlers are provided by useDrawing hook
  // No need to redeclare handleDrawingMouseDown

  const onCanvasBgColorChange = useCallback((color) => {
    setCanvasBgColor(color);
    setCanvasBgImage(null);
  }, [setCanvasBgColor, setCanvasBgImage]);

  const onCanvasBgImageChange = useCallback((imageUrl) => {
    setCanvasBgImage(imageUrl);
    setCanvasBgColor('transparent');
  }, [setCanvasBgImage, setCanvasBgColor]);

  // Handle toggle background (Remove BG)
  const handleToggleBackground = useCallback(() => {
    if (tempBgState) {
      // Restore previous background
      setCanvasBgColor(tempBgState.color);
      setCanvasBgImage(tempBgState.image);
      setTempBgState(null);
    } else {
      // Save current background and set to white
      setTempBgState({
        color: canvasBgColor,
        image: canvasBgImage
      });
      setCanvasBgColor('#ffffff');
      setCanvasBgImage(null);
    }
  }, [canvasBgColor, canvasBgImage, tempBgState]);

  // Crop handlers
  const handleStartCrop = useCallback(() => {
    if (!selectedLayer) return;
    const layer = layers.find(l => l.id === selectedLayer);
    if (layer && layer.type === 'image') {
      setCropState({ layerId: selectedLayer });
    }
  }, [selectedLayer, layers]);

  const handleApplyCrop = useCallback((cropRect) => {
    if (!cropState) return;

    const layer = layers.find(l => l.id === cropState.layerId);
    if (!layer) return;

    // Update layer with cropped dimensions
    const newLayers = layers.map(l => {
      if (l.id === cropState.layerId) {
        return {
          ...l,
          x: l.x + cropRect.x,
          y: l.y + cropRect.y,
          width: cropRect.width,
          height: cropRect.height
        };
      }
      return l;
    });

    setLayers(newLayers);
    saveToHistory(newLayers);

    const layerId = cropState.layerId;
    setCropState(null);
    setSelectedLayer(null); // Explicitly clear selection first

    // Re-select after a brief delay to force UI components to remount/refresh
    setTimeout(() => {
      setSelectedLayer(layerId);
    }, 50);
  }, [cropState, layers, setLayers, saveToHistory, setSelectedLayer]);

  const handleCancelCrop = useCallback(() => {
    setCropState(null);
  }, []);

  // Return JSX
  return (
    <div className="flex h-screen bg-gray-50 font-sans relative z-[1] ml-0 pl-0 w-full max-w-full overflow-hidden touch-none">


      {/* Left Sidebar - Hidden on mobile, visible on desktop */}
      <div className="fixed left-0 top-20 bottom-0 z-[10]">
        <div className="h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
            handleAddUploadedImage={handleAddUploadedImage}
            imageSettings={imageSettings}
            templates={templates}
            handleTemplateSelect={handleTemplateSelect}
            drawingSettings={drawingSettings}
            handleDrawingSettingsChange={handleDrawingSettingsChange}
            onCanvasBgColorChange={onCanvasBgColorChange}
            onCanvasBgImageChange={onCanvasBgImageChange}
            handleAddSticker={handleAddSticker}
            handleApplyDesignTemplate={handleApplyDesignTemplate}
            onSave={handleSave}
            layers={layers}
            hasUnsavedChanges={hasUnsavedChanges}
            activeTemplateId={activeTemplateId}

          />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0 overflow-hidden transition-all duration-300 relative lg:ml-0">
        {/* Toolbar Section - Sticky positioned, always shows */}
        {/* Editing Toolbar - Contains Selection, Effects, and Layer-specific controls */}
        <EditingToolbar
          selectedLayer={selectedLayer}
          layer={selectedLayer ? layers.find(l => l.id === selectedLayer) : null}
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
          onEdit={handleImageEdit}
          onEraser={handleImageEraser}
          onClear={handleImageClear}
          onAlign={handleImageAlign}
          onDraw={handleImageDraw}
          onFlip={handleImageFlip}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onSave={handleSave}
          onExport={handleExport}
          onDownload={handleDownloadExport}
          onDuplicate={handleDuplicateSelected}
          hasSelection={!!selectedLayer}
          toggleSection={toggleSection}
          openSections={openSections}
          hoveredOption={hoveredOption}
          setHoveredOption={setHoveredOption}
          selectedTool={selectedTool}
          handleToolSelect={handleToolSelect}
          drawingSettings={drawingSettings}
          handleDrawingSettingsChange={handleDrawingSettingsChange}
          onToggleBackground={handleToggleBackground}
          isBgRemoved={!!tempBgState}
          onStartCrop={handleStartCrop}
          isCropping={!!cropState}
          layers={layers}
          canvasSize={canvasSize}
          zoom={zoom}
          pan={pan}
          canvasBgColor={canvasBgColor}
          canvasBgImage={canvasBgImage}
          projectName={projectName}
          isExistingProject={!!projectId && !isPrefillImport}
          userRole={user?.role}
        />

        {/* Canvas Area - scrollable container with all pages */}
        <div
          onClick={handleOutsideClick}
          className="flex-1 flex flex-col justify-center items-center min-h-0 h-full overflow-y-auto overflow-x-hidden"
        >
          {pages.map((page, pageIndex) => {
            const isActivePage = pageIndex === currentPageIndex;
            const pageRefs = getOrCreateRefs(page.id);
            const pageLayers = isActivePage ? layers : (page.layers || []);

            return (
              <div key={page.id} className="w-full flex justify-center items-center mb-8 sm:mb-16 last:mb-3 sm:last:mb-6 px-2 sm:px-4">
                <div className="flex justify-center items-center mr-40">
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
                    handleCanvasMouseMove={isActivePage ? handleCanvasMouseMoveWrapper : () => { }}
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
                    canvasBgImage={canvasBgImage}
                    handleUndo={isActivePage ? handleUndo : () => { }}
                    handleRedo={isActivePage ? handleRedo : () => { }}
                    pageId={page.id}
                    onPageRemove={handlePageRemove}
                    canRemovePage={pages.length > 1}
                    alignmentGuides={isActivePage ? alignmentGuides : { x: [], y: [] }}
                    cropState={isActivePage ? cropState : null}
                    onApplyCrop={isActivePage ? handleApplyCrop : () => { }}
                    onCancelCrop={isActivePage ? handleCancelCrop : () => { }}
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
          setCanvasSize={setCanvasSize}
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

      {isRightSidebarOpen && layers.length > 0 && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[15]"
          onClick={() => setIsRightSidebarOpen(false)}
        />
      )}

      {/* Right Sidebar */}
      {
        layers.length > 0 && (
          <div className={`${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 fixed lg:relative right-0 top-0 bottom-0 z-[16] lg:z-auto transition-transform duration-300 ease-in-out`}>
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
            {/* Close button for mobile */}
            <button
              onClick={() => setIsRightSidebarOpen(false)}
              className="lg:hidden absolute top-2 left-2 bg-white border border-gray-300 rounded-full p-1.5 shadow-lg hover:bg-gray-50 z-[17]"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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

