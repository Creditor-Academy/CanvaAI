import React, { useState, useCallback, useMemo } from 'react';
import { useHistory } from './hooks/useHistory';
import { useZoom } from './hooks/useZoom';
import { useSelection } from './hooks/useSelection';
import { useAlignmentGuides } from './hooks/useAlignmentGuides';
import { createEmptyPresentation, createEmptySlide, createLayer } from './models/presentationModel';
import TopBar from './components/TopBar';
import SlidesPanel from './components/SlidesPanel';
import RightPanel from './components/RightPanel';
import CanvasShell from './components/CanvasShell';
import StageWrapper from './components/StageWrapper';

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
  const initialPres = initialPresentation || createEmptyPresentation();
  
  // History management (undo/redo)
  const { state: presentation, setState: setPresentation, undo, redo, canUndo, canRedo } = useHistory(initialPres);

  // Active slide management
  const [activeSlideId, setActiveSlideId] = useState(presentation.slides[0]?.id);
  const activeSlide = useMemo(
    () => presentation.slides.find((s) => s.id === activeSlideId) || presentation.slides[0],
    [presentation.slides, activeSlideId]
  );

  // Zoom and pan
  const { zoom, setZoom, zoomIn, zoomOut, resetZoom, pan, setPan } = useZoom({
    initialZoom: 1,
  });

  // Selection
  const { selectedIds, selectLayer, clearSelection, isSelected } = useSelection();

  // Alignment guides
  const { guides, showGuides, hideGuides, calculateGuides } = useAlignmentGuides();

  // Tool selection
  const [selectedTool, setSelectedTool] = useState('select');

  // Save status
  const [isSaved, setIsSaved] = useState(true);

  // Canvas dimensions
  const canvasWidth = presentation.settings.width;
  const canvasHeight = presentation.settings.height;

  /**
   * Add a new slide
   */
  const handleAddSlide = useCallback(() => {
    const newSlide = createEmptySlide();
    newSlide.name = `Slide ${presentation.slides.length + 1}`;
    
    setPresentation((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    
    setActiveSlideId(newSlide.id);
  }, [presentation.slides.length, setPresentation]);

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
    setSelectedTool(toolId);
    clearSelection();
    
    // TODO: Handle tool-specific actions
    // - Text: Create text layer on next click
    // - Image: Open image picker
    // - Shape: Create shape on next click
    // - Background: Open background picker
    // - Theme: Open theme picker
  }, [clearSelection]);

  /**
   * Handle stage click (canvas background)
   */
  const handleStageClick = useCallback((e) => {
    // Clear selection if clicking on background
    if (e.target === e.target.getStage() || e.target.name() === 'background') {
      clearSelection();
    }
    
    // TODO: Handle tool-specific actions on click
    // - If text tool selected: Create text layer at click position
    // - If shape tool selected: Create shape at click position
  }, [clearSelection, selectedTool]);

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
    // TODO: Update layer position in presentation
    // TODO: Calculate and show alignment guides
    // TODO: Save to history
    
    hideGuides();
  }, [hideGuides]);

  /**
   * Handle layer transform end (resize/rotate)
   */
  const handleLayerTransformEnd = useCallback((layerId, transform) => {
    // TODO: Update layer transform in presentation
    // TODO: Save to history
  }, []);

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
   * Handle wheel for zoom
   */
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) => Math.max(0.1, Math.min(3, prev * delta)));
    }
  }, [setZoom]);

  /**
   * Render layers for Stage
   */
  const renderLayers = useCallback(() => {
    // TODO: Render actual layers using react-konva components
    // - Text layers: Konva Text
    // - Image layers: Konva Image
    // - Shape layers: Konva Rect/Circle/etc.
    // - Handle selection highlighting
    // - Handle drag and transform
    
    return null;
  }, [activeSlide, selectedIds, zoom]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <TopBar
        // Title bar
        presentationTitle={presentation.title}
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
        onFitToScreen={resetZoom}
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
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Slides */}
        <SlidesPanel
          slides={presentation.slides}
          activeSlideId={activeSlideId}
          onSlideSelect={handleSlideSelect}
          onAddSlide={handleAddSlide}
        />

        {/* Center - Canvas */}
        <CanvasShell
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          zoom={zoom}
          pan={pan}
          onWheel={handleWheel}
          onMouseDown={() => {}}
          onMouseMove={() => {}}
          onMouseUp={() => {}}
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
          />
        </CanvasShell>

        {/* Right Panel */}
        <RightPanel
          onThemeSelect={handleThemeSelect}
          onPresent={handlePresent}
        />
      </div>
    </div>
  );
};

export default PresentationWorkspace;
