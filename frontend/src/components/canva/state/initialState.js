// Initial state values for CanvaEditor
export const initialTemplates = [
  { id: 1, name: 'Default Canvas', width: 800, height: 600, thumbnail: '🧩', category: 'Basic' },
  { id: 2, name: 'Social Media Post', width: 1080, height: 1080, thumbnail: '📱', category: 'Social' },
  { id: 3, name: 'Instagram Story', width: 1080, height: 1920, thumbnail: '📸', category: 'Social' },
  { id: 4, name: 'Facebook Cover', width: 1200, height: 630, thumbnail: '📘', category: 'Social' },
  { id: 5, name: 'YouTube Thumbnail', width: 1280, height: 720, thumbnail: '🎥', category: 'Video' },
  { id: 6, name: 'Business Card', width: 1050, height: 600, thumbnail: '💼', category: 'Business' },
  { id: 7, name: 'Presentation', width: 1920, height: 1080, thumbnail: '📊', category: 'Business' },
  { id: 8, name: 'Logo Design', width: 800, height: 800, thumbnail: '🎨', category: 'Branding' },
  { id: 9, name: 'Poster', width: 1080, height: 1350, thumbnail: '🖼️', category: 'Print' },
  { id: 10, name: 'Banner', width: 1200, height: 300, thumbnail: '🏷️', category: 'Web' },
  { id: 11, name: 'Flyer', width: 850, height: 1100, thumbnail: '📄', category: 'Print' },
];



export const initialTextSettings = {
  fontSize: 16,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#000000',
  textAlign: 'left'
};

export const initialShapeSettings = {
  fillColor: '#3182ce',
  strokeColor: '#000000',
  strokeWidth: 1,
  fillType: 'color', // 'color' | 'image'
  fillImageSrc: null,
  fillImageFit: 'cover' // 'cover' | 'contain'
};

export const initialImageSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  opacity: 100,
  strokeColor: '#000000',
  strokeWidth: 0,
  strokeStyle: 'solid', // 'solid' | 'dashed'
  cornerRadius: 4,
  animation: 'none' // 'none' | 'fadeIn' | 'slideInUp' | 'slideInLeft' | 'zoomIn'
};

export const initialDrawingSettings = {
  brushSize: 5,
  brushColor: '#000000',
  isDrawing: false,
  drawingMode: 'brush', // 'brush', 'pen', 'eraser'
  opacity: 100
};

export const initialCanvasSize = { width: 800, height: 600 };

export const initialOpenSections = {
  selection: true,
  text: true,
  shapes: true,
  drawing: false,
  media: true,
  templates: true,
  canvas: true,
};

export const initialScrollMetrics = {
  contentWidth: 0,
  contentHeight: 0,
  viewportWidth: 0,
  viewportHeight: 0,
  scrollLeft: 0,
  scrollTop: 0,
  hThumbSize: 0,
  vThumbSize: 0,
  hThumbPos: 0,
  vThumbPos: 0,
  showH: false,
  showV: false
};

export const SCROLLER_THICKNESS = 12; // px
export const SCROLLER_MARGIN = 8; // px
