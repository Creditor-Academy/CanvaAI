import React, { createContext, useContext, useReducer, useMemo } from 'react';

// Initial state for image management
const initialImageState = {
  // Image upload states
  selectedFiles: [],
  imagePreview: '',
  uploadProgress: 0,
  isImageUploading: false,
  
  // Image properties
  imageProperties: {
    width: 'auto',
    height: 'auto',
    alignment: 'left',
    wrap: 'inline',
    rotation: 0,
    opacity: 100,
    borderColor: '#000000',
    borderWidth: 0
  },
  
  // Image insertion
  showImageModal: false,
  imageInsertMethod: 'url', // 'url', 'upload', 'unsplash'
  imageUrl: '',
  imageSearchQuery: '',
  unsplashImages: [],
  isLoadingImages: false,
  selectedImageAlt: '',
  
  // Media elements
  mediaElements: [],
  selectedMedia: null,
  showMediaPanel: false,
  
  // Watermarks and shapes
  watermarks: [],
  shapes: [],
  drawingMode: null, // 'rectangle', 'circle', 'line', 'freehand'
  drawingColor: '#000000',
  drawingStrokeWidth: 2
};

// Action types
const IMAGE_ACTIONS = {
  SET_SELECTED_FILES: 'SET_SELECTED_FILES',
  SET_IMAGE_PREVIEW: 'SET_IMAGE_PREVIEW',
  SET_UPLOAD_PROGRESS: 'SET_UPLOAD_PROGRESS',
  SET_IMAGE_UPLOADING: 'SET_IMAGE_UPLOADING',
  UPDATE_IMAGE_PROPERTIES: 'UPDATE_IMAGE_PROPERTIES',
  SET_IMAGE_MODAL: 'SET_IMAGE_MODAL',
  SET_IMAGE_INSERT_METHOD: 'SET_IMAGE_INSERT_METHOD',
  SET_IMAGE_URL: 'SET_IMAGE_URL',
  SET_IMAGE_SEARCH_QUERY: 'SET_IMAGE_SEARCH_QUERY',
  SET_UNSPLASH_IMAGES: 'SET_UNSPLASH_IMAGES',
  SET_LOADING_IMAGES: 'SET_LOADING_IMAGES',
  SET_SELECTED_IMAGE_ALT: 'SET_SELECTED_IMAGE_ALT',
  SET_MEDIA_ELEMENTS: 'SET_MEDIA_ELEMENTS',
  SET_SELECTED_MEDIA: 'SET_SELECTED_MEDIA',
  SET_MEDIA_PANEL: 'SET_MEDIA_PANEL',
  SET_WATERMARKS: 'SET_WATERMARKS',
  SET_SHAPES: 'SET_SHAPES',
  SET_DRAWING_MODE: 'SET_DRAWING_MODE',
  SET_DRAWING_COLOR: 'SET_DRAWING_COLOR',
  SET_DRAWING_STROKE_WIDTH: 'SET_DRAWING_STROKE_WIDTH',
  ADD_MEDIA_ELEMENT: 'ADD_MEDIA_ELEMENT',
  REMOVE_MEDIA_ELEMENT: 'REMOVE_MEDIA_ELEMENT',
  CLEAR_SELECTED_FILES: 'CLEAR_SELECTED_FILES'
};

// Reducer function
const imageReducer = (state, action) => {
  switch (action.type) {
    case IMAGE_ACTIONS.SET_SELECTED_FILES:
      return {
        ...state,
        selectedFiles: action.payload
      };
    
    case IMAGE_ACTIONS.SET_IMAGE_PREVIEW:
      return {
        ...state,
        imagePreview: action.payload
      };
    
    case IMAGE_ACTIONS.SET_UPLOAD_PROGRESS:
      return {
        ...state,
        uploadProgress: action.payload
      };
    
    case IMAGE_ACTIONS.SET_IMAGE_UPLOADING:
      return {
        ...state,
        isImageUploading: action.payload
      };
    
    case IMAGE_ACTIONS.UPDATE_IMAGE_PROPERTIES:
      return {
        ...state,
        imageProperties: { ...state.imageProperties, ...action.payload }
      };
    
    case IMAGE_ACTIONS.SET_IMAGE_MODAL:
      return {
        ...state,
        showImageModal: action.payload
      };
    
    case IMAGE_ACTIONS.SET_IMAGE_INSERT_METHOD:
      return {
        ...state,
        imageInsertMethod: action.payload
      };
    
    case IMAGE_ACTIONS.SET_IMAGE_URL:
      return {
        ...state,
        imageUrl: action.payload
      };
    
    case IMAGE_ACTIONS.SET_IMAGE_SEARCH_QUERY:
      return {
        ...state,
        imageSearchQuery: action.payload
      };
    
    case IMAGE_ACTIONS.SET_UNSPLASH_IMAGES:
      return {
        ...state,
        unsplashImages: action.payload
      };
    
    case IMAGE_ACTIONS.SET_LOADING_IMAGES:
      return {
        ...state,
        isLoadingImages: action.payload
      };
    
    case IMAGE_ACTIONS.SET_SELECTED_IMAGE_ALT:
      return {
        ...state,
        selectedImageAlt: action.payload
      };
    
    case IMAGE_ACTIONS.SET_MEDIA_ELEMENTS:
      return {
        ...state,
        mediaElements: action.payload
      };
    
    case IMAGE_ACTIONS.SET_SELECTED_MEDIA:
      return {
        ...state,
        selectedMedia: action.payload
      };
    
    case IMAGE_ACTIONS.SET_MEDIA_PANEL:
      return {
        ...state,
        showMediaPanel: action.payload
      };
    
    case IMAGE_ACTIONS.SET_WATERMARKS:
      return {
        ...state,
        watermarks: action.payload
      };
    
    case IMAGE_ACTIONS.SET_SHAPES:
      return {
        ...state,
        shapes: action.payload
      };
    
    case IMAGE_ACTIONS.SET_DRAWING_MODE:
      return {
        ...state,
        drawingMode: action.payload
      };
    
    case IMAGE_ACTIONS.SET_DRAWING_COLOR:
      return {
        ...state,
        drawingColor: action.payload
      };
    
    case IMAGE_ACTIONS.SET_DRAWING_STROKE_WIDTH:
      return {
        ...state,
        drawingStrokeWidth: action.payload
      };
    
    case IMAGE_ACTIONS.ADD_MEDIA_ELEMENT:
      return {
        ...state,
        mediaElements: [...state.mediaElements, action.payload]
      };
    
    case IMAGE_ACTIONS.REMOVE_MEDIA_ELEMENT:
      return {
        ...state,
        mediaElements: state.mediaElements.filter((_, index) => index !== action.payload)
      };
    
    case IMAGE_ACTIONS.CLEAR_SELECTED_FILES:
      return {
        ...state,
        selectedFiles: [],
        imagePreview: '',
        uploadProgress: 0
      };
    
    default:
      return state;
  }
};

// Create context
const ImageContext = createContext();

// Provider component
export const ImageProvider = ({ children, initialData = {} }) => {
  const [state, dispatch] = useReducer(imageReducer, {
    ...initialImageState,
    ...initialData
  });

  // Action creators
  const setSelectedFiles = (files) => {
    dispatch({ type: IMAGE_ACTIONS.SET_SELECTED_FILES, payload: files });
  };

  const setImagePreview = (preview) => {
    dispatch({ type: IMAGE_ACTIONS.SET_IMAGE_PREVIEW, payload: preview });
  };

  const setUploadProgress = (progress) => {
    dispatch({ type: IMAGE_ACTIONS.SET_UPLOAD_PROGRESS, payload: progress });
  };

  const setImageUploading = (uploading) => {
    dispatch({ type: IMAGE_ACTIONS.SET_IMAGE_UPLOADING, payload: uploading });
  };

  const updateImageProperties = (properties) => {
    dispatch({ type: IMAGE_ACTIONS.UPDATE_IMAGE_PROPERTIES, payload: properties });
  };

  const setImageModal = (show) => {
    dispatch({ type: IMAGE_ACTIONS.SET_IMAGE_MODAL, payload: show });
  };

  const setImageInsertMethod = (method) => {
    dispatch({ type: IMAGE_ACTIONS.SET_IMAGE_INSERT_METHOD, payload: method });
  };

  const setImageUrl = (url) => {
    dispatch({ type: IMAGE_ACTIONS.SET_IMAGE_URL, payload: url });
  };

  const setImageSearchQuery = (query) => {
    dispatch({ type: IMAGE_ACTIONS.SET_IMAGE_SEARCH_QUERY, payload: query });
  };

  const setUnsplashImages = (images) => {
    dispatch({ type: IMAGE_ACTIONS.SET_UNSPLASH_IMAGES, payload: images });
  };

  const setLoadingImages = (loading) => {
    dispatch({ type: IMAGE_ACTIONS.SET_LOADING_IMAGES, payload: loading });
  };

  const setSelectedImageAlt = (alt) => {
    dispatch({ type: IMAGE_ACTIONS.SET_SELECTED_IMAGE_ALT, payload: alt });
  };

  const setMediaElements = (elements) => {
    dispatch({ type: IMAGE_ACTIONS.SET_MEDIA_ELEMENTS, payload: elements });
  };

  const setSelectedMedia = (media) => {
    dispatch({ type: IMAGE_ACTIONS.SET_SELECTED_MEDIA, payload: media });
  };

  const setMediaPanel = (show) => {
    dispatch({ type: IMAGE_ACTIONS.SET_MEDIA_PANEL, payload: show });
  };

  const setWatermarks = (watermarks) => {
    dispatch({ type: IMAGE_ACTIONS.SET_WATERMARKS, payload: watermarks });
  };

  const setShapes = (shapes) => {
    dispatch({ type: IMAGE_ACTIONS.SET_SHAPES, payload: shapes });
  };

  const setDrawingMode = (mode) => {
    dispatch({ type: IMAGE_ACTIONS.SET_DRAWING_MODE, payload: mode });
  };

  const setDrawingColor = (color) => {
    dispatch({ type: IMAGE_ACTIONS.SET_DRAWING_COLOR, payload: color });
  };

  const setDrawingStrokeWidth = (width) => {
    dispatch({ type: IMAGE_ACTIONS.SET_DRAWING_STROKE_WIDTH, payload: width });
  };

  const addMediaElement = (element) => {
    dispatch({ type: IMAGE_ACTIONS.ADD_MEDIA_ELEMENT, payload: element });
  };

  const removeMediaElement = (index) => {
    dispatch({ type: IMAGE_ACTIONS.REMOVE_MEDIA_ELEMENT, payload: index });
  };

  const clearSelectedFiles = () => {
    dispatch({ type: IMAGE_ACTIONS.CLEAR_SELECTED_FILES });
  };

  // Memoized context value
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    actions: {
      setSelectedFiles,
      setImagePreview,
      setUploadProgress,
      setImageUploading,
      updateImageProperties,
      setImageModal,
      setImageInsertMethod,
      setImageUrl,
      setImageSearchQuery,
      setUnsplashImages,
      setLoadingImages,
      setSelectedImageAlt,
      setMediaElements,
      setSelectedMedia,
      setMediaPanel,
      setWatermarks,
      setShapes,
      setDrawingMode,
      setDrawingColor,
      setDrawingStrokeWidth,
      addMediaElement,
      removeMediaElement,
      clearSelectedFiles
    }
  }), [state]);

  return (
    <ImageContext.Provider value={contextValue}>
      {children}
    </ImageContext.Provider>
  );
};

// Custom hook to use the image context
export const useImageContext = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageContext must be used within an ImageProvider');
  }
  return context;
};

// Custom hooks for specific image-related functionality
export const useImageUpload = () => {
  const { state, actions } = useImageContext();
  
  return {
    selectedFiles: state.selectedFiles,
    imagePreview: state.imagePreview,
    uploadProgress: state.uploadProgress,
    isImageUploading: state.isImageUploading,
    imageProperties: state.imageProperties,
    setSelectedFiles: actions.setSelectedFiles,
    setImagePreview: actions.setImagePreview,
    setUploadProgress: actions.setUploadProgress,
    setImageUploading: actions.setImageUploading,
    updateImageProperties: actions.updateImageProperties,
    clearSelectedFiles: actions.clearSelectedFiles
  };
};

export const useImageInsertion = () => {
  const { state, actions } = useImageContext();
  
  return {
    showImageModal: state.showImageModal,
    imageInsertMethod: state.imageInsertMethod,
    imageUrl: state.imageUrl,
    imageSearchQuery: state.imageSearchQuery,
    unsplashImages: state.unsplashImages,
    isLoadingImages: state.isLoadingImages,
    selectedImageAlt: state.selectedImageAlt,
    setImageModal: actions.setImageModal,
    setImageInsertMethod: actions.setImageInsertMethod,
    setImageUrl: actions.setImageUrl,
    setImageSearchQuery: actions.setImageSearchQuery,
    setUnsplashImages: actions.setUnsplashImages,
    setLoadingImages: actions.setLoadingImages,
    setSelectedImageAlt: actions.setSelectedImageAlt
  };
};

export const useMediaManagement = () => {
  const { state, actions } = useImageContext();
  
  return {
    mediaElements: state.mediaElements,
    selectedMedia: state.selectedMedia,
    showMediaPanel: state.showMediaPanel,
    watermarks: state.watermarks,
    shapes: state.shapes,
    drawingMode: state.drawingMode,
    drawingColor: state.drawingColor,
    drawingStrokeWidth: state.drawingStrokeWidth,
    setMediaElements: actions.setMediaElements,
    setSelectedMedia: actions.setSelectedMedia,
    setMediaPanel: actions.setMediaPanel,
    setWatermarks: actions.setWatermarks,
    setShapes: actions.setShapes,
    setDrawingMode: actions.setDrawingMode,
    setDrawingColor: actions.setDrawingColor,
    setDrawingStrokeWidth: actions.setDrawingStrokeWidth,
    addMediaElement: actions.addMediaElement,
    removeMediaElement: actions.removeMediaElement
  };
};