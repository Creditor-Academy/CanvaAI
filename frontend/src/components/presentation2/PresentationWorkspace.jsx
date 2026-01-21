import React, { useState, useCallback, useMemo, useRef, createRef } from 'react';
import { useHistory } from './hooks/useHistory';
import { useCanvasZoom } from './hooks/useCanvasZoom';
import { useSelection } from './hooks/useSelection';
import { useAlignmentGuides } from './hooks/useAlignmentGuides';
import { createEmptyPresentation, createEmptySlide, createLayer } from './models/presentationModel';
import TopBar from './components/TopBar';
import SlidesPanel from './components/SlidesPanel';
import PropertiesPanel from './components/PropertiesPanel';
import CanvasShell from './components/CanvasShell';
import StageWrapper from './components/StageWrapper';
import TextLayer from './components/TextLayer';
import ShapeLayer from './components/ShapeLayer';
import ImageLayer from './components/ImageLayer';
import TransformHandles from './components/TransformHandles';

/**
 * PresentationWorkspace Component
 * 
 * Main orchestrator for the presentation editor.
 * Manages all state and coordinates between components.
 * 
 * Architecture:
 * - State management via hooks
 * - Presentation data model is single source of truth
 * - Canvas logic isolated from UI logic
 * - AI is NOT part of canvas logic (placeholder only)
 */
const PresentationWorkspace = ({ initialPresentation, onClose }) => {
  // Initialize presentation
  const initialPres = useMemo(() => initialPresentation || createEmptyPresentation(), [initialPresentation]);
  
  // History management (undo/redo)
  const { state: presentation, setState: setPresentation, undo, redo, canUndo, canRedo } = useHistory(initialPres);

  // Ensure presentation is always valid with proper structure
  const safePresentation = useMemo(() => {
    // If presentation is invalid, use initialPres
    if (!presentation) {
      return initialPres;
    }
    
    // Ensure slides array exists and is valid
    if (!presentation.slides || !Array.isArray(presentation.slides) || presentation.slides.length === 0) {
      // Return initialPres which should have valid slides
      return initialPres;
    }
    
    // Ensure settings exist
    if (!presentation.settings) {
      return {
        ...presentation,
        settings: initialPres.settings,
      };
    }
    
    return presentation;
  }, [presentation, initialPres]);

  // Active slide management - use function initializer to safely access slides
  const [activeSlideId, setActiveSlideId] = useState(() => {
    const pres = presentation || initialPres;
    return pres?.slides?.[0]?.id;
  });
  const activeSlide = useMemo(() => {
    if (!safePresentation || !safePresentation.slides || !Array.isArray(safePresentation.slides)) {
      return null;
    }
    const slide = safePresentation.slides.find((s) => s.id === activeSlideId) || safePresentation.slides[0];
    // Ensure slide has a layers array
    if (slide && !Array.isArray(slide.layers)) {
      return { ...slide, layers: [] };
    }
    return slide;
  }, [safePresentation, activeSlideId]);

  // Canvas zoom and pan (Google Slides-style)
  const {
    zoom,
    isPanning,
    containerRef,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
  } = useCanvasZoom({
    initialZoom: 1,
    minZoom: 0.2,
    maxZoom: 4,
    zoomStep: 0.1,
  });

  // Selection
  const { selectedIds, selectLayer, clearSelection, isSelected } = useSelection();
  
  // Get selected layers for properties panel
  const selectedLayers = useMemo(() => {
    if (!activeSlide || !Array.isArray(activeSlide.layers)) return [];
    return activeSlide.layers.filter((layer) => selectedIds.includes(layer.id));
  }, [activeSlide, selectedIds]);

  // Alignment guides
  const { guides, showGuides, hideGuides, calculateGuides } = useAlignmentGuides();

  // Tool selection
  const [selectedTool, setSelectedTool] = useState('select');

  // Save status
  const [isSaved, setIsSaved] = useState(true);

  // Canvas dimensions
  const canvasWidth = safePresentation.settings?.width || 960;
  const canvasHeight = safePresentation.settings?.height || 540;

  /**
   * Update a specific layer's properties
   */
  const updateLayer = useCallback((layerId, updates) => {
    if (!activeSlide) return;
    
    setPresentation((prev) => {
      if (!prev || !prev.slides) return prev;
      
      const updatedSlides = prev.slides.map((slide) =>
        slide.id === activeSlideId
          ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId
                  ? { ...layer, ...updates }
                  : layer
              ),
            }
          : slide
      );
      
      return { ...prev, slides: updatedSlides };
    });
    
    setIsSaved(false);
  }, [activeSlide, activeSlideId, setPresentation]);

  /**
   * Update slide background
   */
  const updateSlideBackground = useCallback((color) => {
    if (!activeSlide) return;
    
    setPresentation((prev) => {
      if (!prev || !prev.slides) return prev;
      
      const updatedSlides = prev.slides.map((slide) =>
        slide.id === activeSlideId
          ? { ...slide, background: color }
          : slide
      );
      
      return { ...prev, slides: updatedSlides };
    });
    
    setIsSaved(false);
  }, [activeSlide, activeSlideId, setPresentation]);

  /**
   * Add a new slide
   */
  const handleAddSlide = useCallback(() => {
    const newSlide = createEmptySlide({ 
      width: canvasWidth, 
      height: canvasHeight 
    });
    newSlide.name = `Slide ${safePresentation.slides.length + 1}`;
    
    setPresentation((prev) => ({
      ...prev,
      slides: [...(prev?.slides || []), newSlide],
    }));
    
    setActiveSlideId(newSlide.id);
  }, [safePresentation.slides.length, canvasWidth, canvasHeight, setPresentation]);

  /**
   * Select a slide
   */
  const handleSlideSelect = useCallback((slideId) => {
    setActiveSlideId(slideId);
    clearSelection();
  }, [clearSelection]);

  /**
   * Handle tool selection
   */
  const handleToolSelect = useCallback((toolId) => {
    if (!activeSlide || !activeSlideId) return;
    
    setSelectedTool(toolId);
    clearSelection();
    
    // For text tool, just set the tool - text box will be created on canvas click
    if (toolId === 'text') {
      // Tool is set, wait for canvas click
      return;
    } else if (toolId === 'image') {
      // Open image picker (inline to avoid hoisting issue)
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          // TODO: Handle image upload and create image layer
          console.log('Image selected:', file);
          // For now, just create a placeholder
          const reader = new FileReader();
          reader.onload = (event) => {
            const newLayer = createLayer('image', {
              x: (canvasWidth / 2) - 150,
              y: (canvasHeight / 2) - 150,
              width: 300,
              height: 300,
              src: event.target.result,
            });
            
            setPresentation((prev) => {
              if (!prev || !prev.slides) return prev;
              const updatedSlides = prev.slides.map((slide) =>
                slide.id === activeSlideId
                  ? { 
                      ...slide, 
                      layers: [...(Array.isArray(slide.layers) ? slide.layers : []), newLayer] 
                    }
                  : slide
              );
              return { ...prev, slides: updatedSlides };
            });
            
            selectLayer(newLayer.id);
            setIsSaved(false);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      setSelectedTool('select'); // Switch back to select after opening picker
    } else if (toolId === 'shape') {
      // Just set the tool - shape will be created on canvas click
      return;
    }
  }, [clearSelection, activeSlide, activeSlideId, canvasWidth, canvasHeight, setPresentation, selectLayer]);

  /**
   * Handle stage click (canvas background)
   */
  const handleStageClick = useCallback((e) => {
    if (!activeSlide || !activeSlideId) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    
    // Check if we clicked on the background (not on a layer)
    // In Konva, clicking on the stage itself or the background rect means clicking on background
    const targetType = e.target.getType ? e.target.getType() : '';
    const targetName = e.target.name ? e.target.name() : '';
    const clickedOnBackground = 
      e.target === stage || 
      targetName === 'background' ||
      targetType === 'Stage' ||
      (targetType === 'Rect' && targetName === 'background');
    
    // If we clicked on a layer, don't create new text box
    // Layers will handle their own clicks
    if (!clickedOnBackground) {
      // Still allow layer clicks to be handled
      return;
    }
    
    // Clear selection if clicking on background
    clearSelection();
    
    // Create text box if text tool is selected
    if (selectedTool === 'text') {
      try {
        // Konva pointer position is in scaled coordinates (since Stage is scaled)
        // Convert to unscaled canvas coordinates
        const canvasX = pointerPos.x / zoom;
        const canvasY = pointerPos.y / zoom;
        
        // Ensure coordinates are within reasonable bounds
        const clampedX = Math.max(0, Math.min(canvasX, canvasWidth));
        const clampedY = Math.max(0, Math.min(canvasY, canvasHeight));
        
        const newLayer = createLayer('text', {
          x: Math.max(0, clampedX - 100), // Center the text box horizontally, but don't go negative
          y: Math.max(0, clampedY - 15), // Center the text box vertically, but don't go negative
          width: 200,
          height: 50,
          text: 'Text',
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
        });
        
        setPresentation((prev) => {
          if (!prev || !prev.slides) return prev;
          const updatedSlides = prev.slides.map((slide) =>
            slide.id === activeSlideId
              ? { 
                  ...slide, 
                  layers: [...(Array.isArray(slide.layers) ? slide.layers : []), newLayer] 
                }
              : slide
          );
          return { ...prev, slides: updatedSlides };
        });
        
        selectLayer(newLayer.id);
        setIsSaved(false);
        setSelectedTool('select'); // Switch back to select tool after creating
      } catch (error) {
        console.error('Error creating text layer:', error);
      }
    }
    
    // Create title box if title tool is selected (or we can use a special title style)
    // For now, title box is just a text box with larger font and centered
    if (selectedTool === 'title') {
      try {
        // Konva pointer position is in scaled coordinates (since Stage is scaled)
        // Convert to unscaled canvas coordinates
        const canvasX = pointerPos.x / zoom;
        const canvasY = pointerPos.y / zoom;
        
        const newLayer = createLayer('text', {
          x: canvasX - 150, // Center the title box horizontally
          y: canvasY - 20,
          width: 300,
          height: 60,
          text: 'Title',
          fontSize: 36,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          color: '#000000',
          textAlign: 'center',
        });
        
        setPresentation((prev) => {
          if (!prev || !prev.slides) return prev;
          const updatedSlides = prev.slides.map((slide) =>
            slide.id === activeSlideId
              ? { 
                  ...slide, 
                  layers: [...(Array.isArray(slide.layers) ? slide.layers : []), newLayer] 
                }
              : slide
          );
          return { ...prev, slides: updatedSlides };
        });
        
        selectLayer(newLayer.id);
        setIsSaved(false);
        setSelectedTool('select'); // Switch back to select tool after creating
      } catch (error) {
        console.error('Error creating title layer:', error);
      }
    }
    
    // Create shape if shape tool is selected
    if (selectedTool === 'shape') {
      try {
        const canvasX = pointerPos.x / zoom;
        const canvasY = pointerPos.y / zoom;
        
        const newLayer = createLayer('shape', {
          x: canvasX - 75, // Center the shape horizontally
          y: canvasY - 75, // Center the shape vertically
          width: 150,
          height: 150,
          shape: 'rectangle',
          fill: '#3b82f6',
          stroke: 'transparent',
          strokeWidth: 0,
        });
        
        setPresentation((prev) => {
          if (!prev || !prev.slides) return prev;
          const updatedSlides = prev.slides.map((slide) =>
            slide.id === activeSlideId
              ? { 
                  ...slide, 
                  layers: [...(Array.isArray(slide.layers) ? slide.layers : []), newLayer] 
                }
              : slide
          );
          return { ...prev, slides: updatedSlides };
        });
        
        selectLayer(newLayer.id);
        setIsSaved(false);
        setSelectedTool('select'); // Switch back to select tool after creating
      } catch (error) {
        console.error('Error creating shape layer:', error);
      }
    }
  }, [activeSlide, activeSlideId, clearSelection, selectedTool, zoom, canvasWidth, canvasHeight, setPresentation, selectLayer]);

  /**
   * Handle layer click
   */
  const handleLayerClick = useCallback((layerId, e) => {
    e.cancelBubble = true;
    selectLayer(layerId, e.evt?.ctrlKey || e.evt?.metaKey);
  }, [selectLayer]);

  /**
   * Handle layer drag end
   */
  const handleLayerDragEnd = useCallback((layerId, newPosition) => {
    if (!activeSlide || !activeSlideId) return;
    
    setPresentation((prev) => {
      if (!prev || !prev.slides) return prev;
      const updatedSlides = prev.slides.map((slide) =>
        slide.id === activeSlideId
          ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId
                  ? { ...layer, x: newPosition.x / zoom, y: newPosition.y / zoom }
                  : layer
              ),
            }
          : slide
      );
      return { ...prev, slides: updatedSlides };
    });
    
    setIsSaved(false);
    hideGuides();
  }, [activeSlide, activeSlideId, zoom, setPresentation, hideGuides]);

  /**
   * Handle layer transform end (resize/rotate)
   */
  const handleLayerTransformEnd = useCallback((layerId, transform) => {
    if (!activeSlide || !activeSlideId) return;
    
    setPresentation((prev) => {
      if (!prev || !prev.slides) return prev;
      const updatedSlides = prev.slides.map((slide) =>
        slide.id === activeSlideId
          ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId
                  ? {
                      ...layer,
                      x: transform.x / zoom,
                      y: transform.y / zoom,
                      width: transform.width / zoom,
                      height: transform.height / zoom,
                      rotation: transform.rotation,
                    }
                  : layer
              ),
            }
          : slide
      );
      return { ...prev, slides: updatedSlides };
    });
    
    setIsSaved(false);
  }, [activeSlide, activeSlideId, zoom, setPresentation]);

  /**
   * Handle theme selection
   */
  const handleThemeSelect = useCallback((themeId) => {
    // TODO: Apply theme to presentation
    console.log('Theme selected:', themeId);
  }, []);

  /**
   * Handle present button
   */
  const handlePresent = useCallback(() => {
    // TODO: Open presentation in fullscreen mode
    console.log('Present clicked');
  }, []);

  /**
   * Handle title change
   */
  const handleTitleChange = useCallback((newTitle) => {
    setPresentation((prev) => ({
      ...prev,
      title: newTitle,
    }));
    setIsSaved(false);
    // TODO: Auto-save after debounce
    setTimeout(() => setIsSaved(true), 1000);
  }, [setPresentation]);

  /**
   * Handle star (favorite)
   */
  const handleStar = useCallback(() => {
    // TODO: Toggle favorite status
    console.log('Star clicked');
  }, []);

  /**
   * Handle move (folder)
   */
  const handleMove = useCallback(() => {
    // TODO: Open folder picker
    console.log('Move clicked');
  }, []);

  /**
   * Handle share
   */
  const handleShare = useCallback(() => {
    // TODO: Open share dialog
    console.log('Share clicked');
  }, []);

  /**
   * Handle comment
   */
  const handleComment = useCallback(() => {
    // TODO: Open comment panel
    console.log('Comment clicked');
  }, []);

  /**
   * Handle print
   */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /**
   * Handle format painter
   */
  const handleFormatPainter = useCallback(() => {
    // TODO: Implement format painter (copy style from selected layer)
    console.log('Format painter clicked');
  }, [selectedIds]);

  /**
   * Handle background
   */
  const handleBackground = useCallback(() => {
    // TODO: Open background picker
    console.log('Background clicked');
  }, []);

  /**
   * Handle layout
   */
  const handleLayout = useCallback(() => {
    // TODO: Open layout picker
    console.log('Layout clicked');
  }, []);

  /**
   * Handle transition
   */
  const handleTransition = useCallback(() => {
    // TODO: Open transition picker
    console.log('Transition clicked');
  }, []);
  
  /**
   * Handle layer update (from properties panel)
   */
  const handleUpdateLayer = useCallback((layerId, updates) => {
    if (!activeSlide) return;
    
    setPresentation((prev) => {
      const updatedSlides = prev.slides.map((slide) =>
        slide.id === activeSlideId
          ? {
              ...slide,
              layers: slide.layers.map((layer) =>
                layer.id === layerId
                  ? { ...layer, ...updates, style: { ...layer.style, ...(updates.style || {}) } }
                  : layer
              ),
            }
          : slide
      );
      return { ...prev, slides: updatedSlides };
    });
    
    setIsSaved(false);
  }, [activeSlide, activeSlideId, setPresentation]);
  
  /**
   * Handle slide background update
   */
  const handleUpdateSlideBackground = useCallback((color) => {
    if (!activeSlide) return;
    
    setPresentation((prev) => {
      const updatedSlides = prev.slides.map((slide) =>
        slide.id === activeSlideId
          ? { ...slide, background: color }
          : slide
      );
      return { ...prev, slides: updatedSlides };
    });
    
    setIsSaved(false);
  }, [activeSlide, activeSlideId, setPresentation]);

  // File menu handlers
  const handleRename = useCallback(() => {
    const newTitle = prompt('Enter new presentation name:', safePresentation.title);
    if (newTitle && newTitle.trim()) {
      handleTitleChange(newTitle.trim());
    }
  }, [safePresentation.title, handleTitleChange]);

  const handleCut = useCallback(() => {
    // TODO: Implement cut (copy to clipboard and remove selected layers)
    console.log('Cut clicked');
  }, [selectedIds]);

  const handleCopy = useCallback(() => {
    // TODO: Implement copy (copy selected layers to clipboard)
    console.log('Copy clicked');
  }, [selectedIds]);

  const handlePaste = useCallback(() => {
    // TODO: Implement paste (paste from clipboard)
    console.log('Paste clicked');
  }, []);

  // Insert menu handlers
  const handleInsertImage = useCallback(() => {
    // TODO: Open file picker for image upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // TODO: Handle image upload
        console.log('Image selected:', file);
      }
    };
    input.click();
  }, []);

  const handleInsertImageFromUrl = useCallback(() => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) {
      // TODO: Insert image from URL
      console.log('Image URL:', url);
    }
  }, []);

  const handleInsertTextBox = useCallback(() => {
    if (!activeSlide || !activeSlideId) return;
    
    // Create text box immediately at center of canvas (like Google Slides)
    const newLayer = createLayer('text', {
      x: (canvasWidth / 2) - 100, // Center horizontally
      y: (canvasHeight / 2) - 25, // Center vertically
      width: 200,
      height: 50,
      text: 'Text',
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#000000',
    });
    
    setPresentation((prev) => {
      if (!prev || !prev.slides) return prev;
      const updatedSlides = prev.slides.map((slide) =>
        slide.id === activeSlideId
          ? { 
              ...slide, 
              layers: [...(Array.isArray(slide.layers) ? slide.layers : []), newLayer] 
            }
          : slide
      );
      return { ...prev, slides: updatedSlides };
    });
    
    selectLayer(newLayer.id);
    setIsSaved(false);
    setSelectedTool('select'); // Switch to select tool after creating
  }, [activeSlide, activeSlideId, canvasWidth, canvasHeight, setPresentation, selectLayer]);

  /**
   * Create a title box at the center of the canvas
   */
  const handleInsertTitleBox = useCallback(() => {
    if (!activeSlide || !activeSlideId) return;
    
    const newLayer = createLayer('text', {
      x: (canvasWidth / 2) - 150, // Center horizontally
      y: 50, // Top area
      width: 300,
      height: 60,
      text: 'Title',
      fontSize: 36,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'center',
    });
    
    setPresentation((prev) => {
      if (!prev || !prev.slides) return prev;
      const updatedSlides = prev.slides.map((slide) =>
        slide.id === activeSlideId
          ? { 
              ...slide, 
              layers: [...(Array.isArray(slide.layers) ? slide.layers : []), newLayer] 
            }
          : slide
      );
      return { ...prev, slides: updatedSlides };
    });
    
    selectLayer(newLayer.id);
    setIsSaved(false);
    setSelectedTool('select'); // Switch to select tool after creating
  }, [activeSlide, activeSlideId, canvasWidth, setPresentation, selectLayer]);

  const handleInsertShape = useCallback(() => {
    setSelectedTool('shape');
    // TODO: Create shape on next canvas click
  }, []);

  const handleInsertTable = useCallback(() => {
    // TODO: Open table creation dialog
    console.log('Insert table clicked');
  }, []);

  const handleInsertChart = useCallback((chartType) => {
    // TODO: Open chart creation dialog
    console.log('Insert chart clicked:', chartType);
  }, []);

  // Format menu handlers
  const handleFormatBold = useCallback(() => {
    // TODO: Apply bold to selected text layers
    console.log('Bold clicked');
  }, [selectedIds]);

  const handleFormatItalic = useCallback(() => {
    // TODO: Apply italic to selected text layers
    console.log('Italic clicked');
  }, [selectedIds]);

  const handleFormatUnderline = useCallback(() => {
    // TODO: Apply underline to selected text layers
    console.log('Underline clicked');
  }, [selectedIds]);

  const handleFormatSuperscript = useCallback(() => {
    // TODO: Apply superscript to selected text layers
    console.log('Superscript clicked');
  }, [selectedIds]);

  const handleFormatSubscript = useCallback(() => {
    // TODO: Apply subscript to selected text layers
    console.log('Subscript clicked');
  }, [selectedIds]);

  const handleFormatSizeIncrease = useCallback(() => {
    // TODO: Increase font size of selected text layers
    console.log('Size increase clicked');
  }, [selectedIds]);

  const handleFormatSizeDecrease = useCallback(() => {
    // TODO: Decrease font size of selected text layers
    console.log('Size decrease clicked');
  }, [selectedIds]);

  const handleFormatColor = useCallback(() => {
    // TODO: Open color picker for text color
    console.log('Color clicked');
  }, [selectedIds]);

  const handleFormatHighlightColor = useCallback(() => {
    // TODO: Open color picker for highlight color
    console.log('Highlight color clicked');
  }, [selectedIds]);

  const handleFormatCapitalization = useCallback((type) => {
    // TODO: Apply capitalization to selected text layers
    console.log('Capitalization clicked:', type);
  }, [selectedIds]);

  // Slide menu handlers
  const handleSlideChangeBackground = useCallback(() => {
    // TODO: Open background color picker
    console.log('Change background clicked');
  }, [activeSlideId]);

  const handleSlideDuplicate = useCallback(() => {
    // TODO: Duplicate active slide
    console.log('Duplicate slide clicked');
  }, [activeSlideId]);

  // Tools menu handlers
  const handleSpellingCheck = useCallback(() => {
    // TODO: Run spelling check
    console.log('Spelling check clicked');
  }, []);

  /**
   * Handle wheel event (handled by useCanvasZoom hook)
   * This is passed directly to CanvasShell
   */
  const handleCanvasWheel = handleWheel;

  // Refs for layer components (needed for transform handles)
  const layerRefs = useRef({});

  /**
   * Render layers for Stage
   */
  const renderLayers = useCallback(() => {
    try {
      if (!activeSlide) return null;
      
      // Ensure layers is an array
      const layers = Array.isArray(activeSlide.layers) ? activeSlide.layers : [];
      if (layers.length === 0) return null;

      return layers.map((layer) => {
        try {
          if (!layer || !layer.id || !layer.type) return null;
          
          if (layer.type === 'text') {
            if (!layerRefs.current[layer.id]) {
              layerRefs.current[layer.id] = createRef();
            }
            const layerRef = layerRefs.current[layer.id];

            // Ensure layer has required properties
            if (typeof layer.x !== 'number' || typeof layer.y !== 'number' || 
                typeof layer.width !== 'number' || typeof layer.height !== 'number') {
              console.warn('Invalid layer properties:', layer);
              return null;
            }

            return (
              <React.Fragment key={layer.id}>
                <TextLayer
                  ref={layerRef}
                  layer={layer}
                  isSelected={isSelected(layer.id)}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                  }}
                  onDragMove={(e) => {
                    // Update position during drag for real-time feedback
                    // Could show alignment guides here
                  }}
                  onDragEnd={(e) => {
                    const newPosition = {
                      x: e.target.x(),
                      y: e.target.y(),
                    };
                    handleLayerDragEnd(layer.id, newPosition);
                  }}
                  onClick={(e) => {
                    handleLayerClick(layer.id, e);
                  }}
                  onDoubleClick={(e) => {
                    // Open text editor
                    const newText = prompt('Edit text:', layer.style?.text || 'Text');
                    if (newText !== null) {
                      setPresentation((prev) => {
                        if (!prev || !prev.slides) return prev;
                        const updatedSlides = prev.slides.map((slide) =>
                          slide.id === activeSlideId
                            ? {
                                ...slide,
                                layers: (Array.isArray(slide.layers) ? slide.layers : []).map((l) =>
                                  l.id === layer.id
                                    ? {
                                        ...l,
                                        style: { ...(l.style || {}), text: newText },
                                      }
                                    : l
                                ),
                              }
                            : slide
                        );
                        return { ...prev, slides: updatedSlides };
                      });
                      setIsSaved(false);
                    }
                  }}
                  scale={zoom}
                />
                {/* Transform handles for selected layer */}
                {isSelected(layer.id) && (
                  <TransformHandles
                    targetRef={layerRef}
                    isVisible={true}
                    scale={zoom}
                    onTransformEnd={(transform) => {
                      handleLayerTransformEnd(layer.id, transform);
                    }}
                    layer={layer}
                  />
                )}
              </React.Fragment>
            );
          }
          
          if (layer.type === 'shape') {
            if (!layerRefs.current[layer.id]) {
              layerRefs.current[layer.id] = createRef();
            }
            const layerRef = layerRefs.current[layer.id];

            if (typeof layer.x !== 'number' || typeof layer.y !== 'number' || 
                typeof layer.width !== 'number' || typeof layer.height !== 'number') {
              console.warn('Invalid layer properties:', layer);
              return null;
            }

            return (
              <React.Fragment key={layer.id}>
                <ShapeLayer
                  ref={layerRef}
                  layer={layer}
                  isSelected={isSelected(layer.id)}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                  }}
                  onDragMove={(e) => {
                    // Update position during drag
                  }}
                  onDragEnd={(e) => {
                    const newPosition = {
                      x: e.target.x(),
                      y: e.target.y(),
                    };
                    handleLayerDragEnd(layer.id, newPosition);
                  }}
                  onClick={(e) => {
                    handleLayerClick(layer.id, e);
                  }}
                  scale={zoom}
                />
                {isSelected(layer.id) && (
                  <TransformHandles
                    targetRef={layerRef}
                    isVisible={true}
                    scale={zoom}
                    onTransformEnd={(transform) => {
                      handleLayerTransformEnd(layer.id, transform);
                    }}
                    layer={layer}
                  />
                )}
              </React.Fragment>
            );
          }
          
          if (layer.type === 'image') {
            if (!layerRefs.current[layer.id]) {
              layerRefs.current[layer.id] = createRef();
            }
            const layerRef = layerRefs.current[layer.id];

            if (typeof layer.x !== 'number' || typeof layer.y !== 'number' || 
                typeof layer.width !== 'number' || typeof layer.height !== 'number') {
              console.warn('Invalid layer properties:', layer);
              return null;
            }

            return (
              <React.Fragment key={layer.id}>
                <ImageLayer
                  ref={layerRef}
                  layer={layer}
                  isSelected={isSelected(layer.id)}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                  }}
                  onDragMove={(e) => {
                    // Update position during drag
                  }}
                  onDragEnd={(e) => {
                    const newPosition = {
                      x: e.target.x(),
                      y: e.target.y(),
                    };
                    handleLayerDragEnd(layer.id, newPosition);
                  }}
                  onClick={(e) => {
                    handleLayerClick(layer.id, e);
                  }}
                  scale={zoom}
                />
                {isSelected(layer.id) && (
                  <TransformHandles
                    targetRef={layerRef}
                    isVisible={true}
                    scale={zoom}
                    onTransformEnd={(transform) => {
                      handleLayerTransformEnd(layer.id, transform);
                    }}
                    layer={layer}
                  />
                )}
              </React.Fragment>
            );
          }
          
          return null;
        } catch (error) {
          console.error('Error rendering layer:', layer, error);
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error('Error in renderLayers:', error);
      return null;
    }
  }, [activeSlide, selectedIds, zoom, isSelected, handleLayerClick, handleLayerDragEnd, handleLayerTransformEnd, activeSlideId, setPresentation]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <TopBar
        // Title bar
        presentationTitle={safePresentation.title}
        onTitleChange={handleTitleChange}
        isSaved={isSaved}
        onStar={handleStar}
        onMove={handleMove}
        onShare={handleShare}
        onPresent={handlePresent}
        onComment={handleComment}
        // History
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        // Zoom
        zoom={zoom}
        onZoomChange={setZoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitToScreen={() => fitToScreen(canvasWidth, canvasHeight)}
        // Tools
        onToolSelect={handleToolSelect}
        selectedTool={selectedTool}
        // Actions
        onAddSlide={handleAddSlide}
        onPrint={handlePrint}
        onFormatPainter={handleFormatPainter}
        onBackground={handleBackground}
        onLayout={handleLayout}
        onTheme={handleThemeSelect}
        onTransition={handleTransition}
        // File menu
        onRename={handleRename}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        // Insert menu
        onInsertImage={handleInsertImage}
        onInsertImageFromUrl={handleInsertImageFromUrl}
        onInsertTextBox={handleInsertTextBox}
        onInsertTitleBox={handleInsertTitleBox}
        onInsertShape={handleInsertShape}
        onInsertTable={handleInsertTable}
        onInsertChart={handleInsertChart}
        // Format menu
        onFormatBold={handleFormatBold}
        onFormatItalic={handleFormatItalic}
        onFormatUnderline={handleFormatUnderline}
        onFormatSuperscript={handleFormatSuperscript}
        onFormatSubscript={handleFormatSubscript}
        onFormatSizeIncrease={handleFormatSizeIncrease}
        onFormatSizeDecrease={handleFormatSizeDecrease}
        onFormatColor={handleFormatColor}
        onFormatHighlightColor={handleFormatHighlightColor}
        onFormatCapitalization={handleFormatCapitalization}
        // Slide menu
        onSlideChangeBackground={handleSlideChangeBackground}
        onSlideDuplicate={handleSlideDuplicate}
        // Tools menu
        onSpellingCheck={handleSpellingCheck}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Slides */}
        <SlidesPanel
          slides={safePresentation.slides}
          activeSlideId={activeSlideId}
          onSlideSelect={handleSlideSelect}
          onAddSlide={handleAddSlide}
        />

        {/* Center - Canvas */}
        <CanvasShell
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          zoom={zoom}
          onWheel={handleCanvasWheel}
          onPanStart={handlePanStart}
          onPanMove={handlePanMove}
          onPanEnd={handlePanEnd}
          containerRef={containerRef}
        >
          <StageWrapper
            width={canvasWidth}
            height={canvasHeight}
            zoom={zoom}
            background={activeSlide?.background}
            layers={activeSlide?.layers || []}
            selectedIds={selectedIds}
            onStageClick={handleStageClick}
            onLayerClick={handleLayerClick}
            onLayerDragEnd={handleLayerDragEnd}
            onLayerTransformEnd={handleLayerTransformEnd}
            renderLayers={renderLayers}
            selectedTool={selectedTool}
          />
        </CanvasShell>

        {/* Right Panel - Properties */}
        <PropertiesPanel
          selectedLayers={selectedLayers}
          activeSlide={activeSlide}
          onUpdateLayer={updateLayer}
          onUpdateSlideBackground={updateSlideBackground}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      </div>
    </div>
  );
};

export default PresentationWorkspace;
