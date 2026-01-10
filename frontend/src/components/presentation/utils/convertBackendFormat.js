import { normalizeImageEffects } from './effectDefaults';

/**
 * Converts backend PPT JSON format to PresentationWorkspace format
 * @param {Object} backendData - Backend JSON with slides array
 * @param {Object} layout - Layout dimensions { width, height }
 * @returns {Array} Array of slides in PresentationWorkspace format
 */
export const convertBackendFormatToSlides = (backendData, layout) => {
  if (!backendData || !backendData.slides || !Array.isArray(backendData.slides)) {
    return [];
  }

  const { width: canvasWidth, height: canvasHeight } = layout;
  const padding = 60; // Padding from edges
  const contentWidth = canvasWidth - (padding * 2);
  const titleAreaHeight = 120;
  const contentAreaStart = titleAreaHeight + 40;

  return backendData.slides.map((slide, index) => {
    const layers = [];
    let timestamp = Date.now() + index;

    // Helper to generate unique layer ID
    const getLayerId = () => `layer-${timestamp++}-${Math.random().toString(16).slice(2, 8)}`;

    // Create title layer
    if (slide.title) {
      const titleLayer = {
        id: getLayerId(),
        type: 'text',
        name: 'Title',
        text: slide.title,
        fontSize: slide.layout === 'title' ? 64 : 48,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#0f172a',
        width: contentWidth,
        height: slide.layout === 'title' ? 150 : 80,
        textAlign: 'center',
        x: padding,
        y: slide.layout === 'title' ? (canvasHeight / 2) - 100 : 40,
        rotation: 0,
        visible: true,
        effects: normalizeImageEffects(),
      };
      layers.push(titleLayer);
    }

    // Handle content based on contentType
    if (slide.content) {
      let contentText = '';
      let contentY = contentAreaStart;
      let contentHeight = 200;

      if (slide.contentType === 'paragraph') {
        contentText = typeof slide.content === 'string' ? slide.content : '';
        contentHeight = 300;
      } else if (slide.contentType === 'bullets') {
        if (Array.isArray(slide.content)) {
          contentText = slide.content.map(item => `• ${item}`).join('\n');
          contentHeight = Math.max(200, slide.content.length * 40);
        } else {
          contentText = String(slide.content);
          contentHeight = 200;
        }
      } else if (slide.contentType === 'comparison') {
        // For comparison, create two text layers side by side
        if (slide.content && typeof slide.content === 'object') {
          const leftItems = Array.isArray(slide.content.left) 
            ? slide.content.left.map(item => `• ${item}`).join('\n')
            : String(slide.content.left || '');
          const rightItems = Array.isArray(slide.content.right)
            ? slide.content.right.map(item => `• ${item}`).join('\n')
            : String(slide.content.right || '');

          const columnWidth = (contentWidth - 40) / 2; // Two columns with gap

          // Left column
          if (leftItems) {
            layers.push({
              id: getLayerId(),
              type: 'text',
              name: 'Left Content',
              text: leftItems,
              fontSize: 32,
              fontWeight: 'normal',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#0f172a',
              width: columnWidth,
              height: 400,
              textAlign: 'left',
              x: padding,
              y: contentAreaStart,
              rotation: 0,
              visible: true,
              effects: normalizeImageEffects(),
            });
          }

          // Right column
          if (rightItems) {
            layers.push({
              id: getLayerId(),
              type: 'text',
              name: 'Right Content',
              text: rightItems,
              fontSize: 32,
              fontWeight: 'normal',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#0f172a',
              width: columnWidth,
              height: 400,
              textAlign: 'left',
              x: padding + columnWidth + 40,
              y: contentAreaStart,
              rotation: 0,
              visible: true,
              effects: normalizeImageEffects(),
            });
          }
        }
      }

      // Create content layer for paragraph and bullets (comparison is handled above)
      if (slide.contentType !== 'comparison' && contentText) {
        layers.push({
          id: getLayerId(),
          type: 'text',
          name: 'Content',
          text: contentText,
          fontSize: slide.layout === 'title' ? 36 : 32,
          fontWeight: 'normal',
          fontFamily: 'Poppins',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#0f172a',
          width: contentWidth,
          height: contentHeight,
          textAlign: slide.layout === 'title' ? 'center' : 'left',
          x: padding,
          y: slide.layout === 'title' ? (canvasHeight / 2) + 80 : contentAreaStart,
          rotation: 0,
          visible: true,
          effects: normalizeImageEffects(),
        });
      }
    }

    // Create image layer if image exists and has a valid URL
    if (slide.image && slide.image.url && slide.image.url.trim() !== '') {
      console.log(`Converting slide ${slide.slideNo}: Image URL =`, slide.image.url);
      
      // Position image based on layout
      let imageX, imageY, imageWidth, imageHeight;

      if (slide.layout === 'title') {
        // For title layout, image at bottom
        imageWidth = Math.min(canvasWidth * 0.5, 600);
        imageHeight = Math.min(canvasHeight * 0.4, 400);
        imageX = (canvasWidth - imageWidth) / 2;
        imageY = canvasHeight - imageHeight - 60;
      } else if (slide.layout === 'comparison') {
        // For comparison layout, image at the bottom center
        imageWidth = Math.min(canvasWidth * 0.6, 700);
        imageHeight = Math.min(canvasHeight * 0.35, 350);
        imageX = (canvasWidth - imageWidth) / 2;
        imageY = canvasHeight - imageHeight - 40;
      } else {
        // For content layouts, image on the right side
        imageWidth = Math.min(canvasWidth * 0.35, 500);
        imageHeight = Math.min(canvasHeight * 0.5, 450);
        imageX = canvasWidth - imageWidth - padding;
        imageY = (canvasHeight - imageHeight) / 2;
      }

      layers.push({
        id: getLayerId(),
        type: 'image',
        name: 'Image',
        src: slide.image.url,
        width: imageWidth,
        height: imageHeight,
        x: imageX,
        y: imageY,
        rotation: 0,
        visible: true,
        effects: normalizeImageEffects(),
      });
    }

    return {
      id: slide.id || `slide-${slide.slideNo || index + 1}`,
      name: slide.title || `Slide ${slide.slideNo || index + 1}`,
      background: '#ffffff',
      layers: layers,
      animationDuration: 5,
    };
  });
};
