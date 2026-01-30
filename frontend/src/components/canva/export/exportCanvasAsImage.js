import { getFilterCSS, hexToRgba } from '../../../utils/styleUtils';
import { drawRoundedRect, drawShapePath, drawTextLayer } from './exportHelpers';

/**
 * Export canvas as image (PNG/JPEG)
 */
export const exportCanvasAsImage = async (layers, canvasSize, format = 'png', quality = 0.92) => {
  const width = canvasSize.width;
  const height = canvasSize.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Draw shape
  const drawShape = (layer) => {
    const x = layer.x;
    const y = layer.y;
    const w = layer.width || 100;
    const h = layer.height || 100;
    const fill = layer.fillColor || '#3182ce';
    const stroke = layer.strokeColor || '#000000';
    const strokeWidth = Number.isFinite(layer.strokeWidth) ? layer.strokeWidth : 1;
    const s = layer.shape;

    ctx.save();
    ctx.globalAlpha = (layer.opacity ?? 100) / 100;
    ctx.filter = getFilterCSS({
      brightness: layer.brightness ?? 100,
      contrast: layer.contrast ?? 100,
      blur: layer.blur ?? 0
    });

    // Draw shadow first (if enabled)
    if (layer.shadows?.enabled) {
      ctx.save();
      ctx.shadowColor = hexToRgba(layer.shadows.color, (layer.shadows.opacity ?? 50) / 100);
      ctx.shadowBlur = layer.shadows.blur ?? 0;
      ctx.shadowOffsetX = layer.shadows.x ?? 0;
      ctx.shadowOffsetY = layer.shadows.y ?? 0;
      ctx.fillStyle = fill;
      drawShapePath(ctx, s, x, y, w, h, drawRoundedRect);
      if (s === 'star' || s === 'star6') {
        ctx.fill('evenodd');
      } else {
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw actual shape fill
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = fill;

    if (layer.fillType === 'image' && layer.fillImageSrc) {
      // Image fill handled separately
      const path = new Path2D();
      if (s === 'rectangle') {
        path.rect(x, y, w, h);
      } else if (s === 'circle') {
        path.arc(x + Math.min(w, h) / 2, y + Math.min(w, h) / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
      } else if (s === 'triangle') {
        path.moveTo(x + w / 2, y);
        path.lineTo(x, y + h);
        path.lineTo(x + w, y + h);
        path.closePath();
      } else if (s === 'rightTriangle') {
        path.moveTo(x, y);
        path.lineTo(x + w, y);
        path.lineTo(x, y + h);
        path.closePath();
      } else if (s === 'diamond') {
        path.moveTo(x + w / 2, y);
        path.lineTo(x + w, y + h / 2);
        path.lineTo(x + w / 2, y + h);
        path.lineTo(x, y + h / 2);
        path.closePath();
      }
      ctx.clip(path);
      ctx.fillStyle = '#ddd';
      ctx.fill();
    } else {
      drawShapePath(ctx, s, x, y, w, h, drawRoundedRect);
      if (s === 'star' || s === 'star6') {
        ctx.fill('evenodd');
      } else {
        ctx.fill();
      }
    }

    // Draw stroke
    if (strokeWidth > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      if (s === 'star' || s === 'star6') {
        drawShapePath(ctx, s, x, y, w, h, drawRoundedRect);
      }
      ctx.stroke();
    }

    ctx.restore();
  };

  // Draw shape with image fill
  const drawShapeLayerWithImage = async (layer) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const x = layer.x;
        const y = layer.y;
        const w = layer.width || img.width;
        const h = layer.height || img.height;
        const s = layer.shape;

        ctx.save();
        ctx.globalAlpha = (layer.opacity ?? 100) / 100;
        ctx.filter = getFilterCSS({
          brightness: layer.brightness ?? 100,
          contrast: layer.contrast ?? 100,
          blur: layer.blur ?? 0
        });
        
        if (layer.shadows?.enabled) {
          ctx.shadowColor = hexToRgba(layer.shadows.color, (layer.shadows.opacity ?? 50) / 100);
          ctx.shadowBlur = layer.shadows.blur ?? 0;
          ctx.shadowOffsetX = layer.shadows.x ?? 0;
          ctx.shadowOffsetY = layer.shadows.y ?? 0;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        ctx.fillStyle = layer.fillColor || '#3182ce';
        drawShapePath(ctx, s, x, y, w, h, drawRoundedRect);
        if (s === 'star' || s === 'star6') {
          ctx.fill('evenodd');
        } else {
          ctx.fill();
        }

        // Clip and draw image
        ctx.save();
        drawShapePath(ctx, s, x, y, w, h, drawRoundedRect);
        ctx.clip();

        const ir = img.width / img.height;
        const r = w / h;
        let dw = w, dh = h, dx = x, dy = y;
        if (layer.fillImageFit === 'contain' ? ir > r : ir < r) {
          dh = w / ir; dy = y + (h - dh) / 2;
        } else {
          dw = h * ir; dx = x + (w - dw) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();

        // Stroke
        const sw = Number.isFinite(layer.strokeWidth) ? layer.strokeWidth : 0;
        if (sw > 0) {
          ctx.lineWidth = sw;
          ctx.strokeStyle = layer.strokeColor || '#000000';
          drawShapePath(ctx, s, x, y, w, h, drawRoundedRect);
          ctx.stroke();
        }

        ctx.restore();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = layer.fillImageSrc;
    });
  };

  // Draw image layer
  const drawImageLayer = async (layer) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const x = layer.x;
        const y = layer.y;
        const w = layer.width || img.width;
        const h = layer.height || img.height;

        ctx.save();
        ctx.globalAlpha = (layer.opacity ?? 100) / 100;
        ctx.filter = getFilterCSS({
          brightness: layer.brightness ?? 100,
          contrast: layer.contrast ?? 100,
          blur: layer.blur ?? 0
        });
        
        if (layer.shadows?.enabled) {
          ctx.shadowColor = hexToRgba(layer.shadows.color, (layer.shadows.opacity ?? 50) / 100);
          ctx.shadowBlur = layer.shadows.blur ?? 0;
          ctx.shadowOffsetX = layer.shadows.x ?? 0;
          ctx.shadowOffsetY = layer.shadows.y ?? 0;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        // Corner radius mask
        const r = Math.max(0, Math.min(layer.cornerRadius ?? 4, Math.min(w, h) / 2));
        if (r > 0) {
          const path = new Path2D();
          path.moveTo(x + r, y);
          path.lineTo(x + w - r, y);
          path.quadraticCurveTo(x + w, y, x + w, y + r);
          path.lineTo(x + w, y + h - r);
          path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          path.lineTo(x + r, y + h);
          path.quadraticCurveTo(x, y + h, x, y + h - r);
          path.lineTo(x, y + r);
          path.quadraticCurveTo(x, y, x + r, y);
          path.closePath();
          ctx.save();
          ctx.clip(path);
          ctx.drawImage(img, x, y, w, h);
          ctx.restore();
        } else {
          ctx.drawImage(img, x, y, w, h);
        }

        // Stroke
        const sw = Number.isFinite(layer.strokeWidth) ? layer.strokeWidth : 0;
        if (sw > 0) {
          ctx.save();
          ctx.lineWidth = sw;
          ctx.strokeStyle = layer.strokeColor || '#000000';
          if (layer.strokeStyle === 'dashed') ctx.setLineDash([8, 6]);
          const path = new Path2D();
          const inset = sw / 2;
          const rx = Math.max(0, Math.min((layer.cornerRadius ?? 4), Math.min(w, h) / 2));
          path.moveTo(x + inset + rx, y + inset);
          path.lineTo(x + w - inset - rx, y + inset);
          path.quadraticCurveTo(x + w - inset, y + inset, x + w - inset, y + inset + rx);
          path.lineTo(x + w - inset, y + h - inset - rx);
          path.quadraticCurveTo(x + w - inset, y + h - inset, x + w - inset - rx, y + h - inset);
          path.lineTo(x + inset + rx, y + h - inset);
          path.quadraticCurveTo(x + inset, y + h - inset, x + inset, y + h - inset - rx);
          path.lineTo(x + inset, y + inset + rx);
          path.quadraticCurveTo(x + inset, y + inset, x + inset + rx, y + inset);
          path.closePath();
          ctx.stroke(path);
          ctx.restore();
        }

        ctx.restore();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = layer.src;
    });
  };

  // Draw drawing layer
  const drawDrawingLayer = (layer) => {
    if (!Array.isArray(layer.path) || layer.path.length < 2) return;
    ctx.save();
    ctx.globalAlpha = (layer.opacity ?? 100) / 100;
    ctx.filter = getFilterCSS({
      brightness: layer.brightness ?? 100,
      contrast: layer.contrast ?? 100,
      blur: layer.blur ?? 0
    });
    
    if (layer.shadows?.enabled) {
      ctx.shadowColor = hexToRgba(layer.shadows.color, (layer.shadows.opacity ?? 50) / 100);
      ctx.shadowBlur = layer.shadows.blur ?? 0;
      ctx.shadowOffsetX = layer.shadows.x ?? 0;
      ctx.shadowOffsetY = layer.shadows.y ?? 0;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    ctx.lineWidth = layer.brushSize || 5;
    ctx.strokeStyle = layer.color || '#000000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const start = layer.path[0];
    ctx.moveTo(layer.x + start.x, layer.y + start.y);
    for (let i = 1; i < layer.path.length; i++) {
      const p = layer.path[i];
      ctx.lineTo(layer.x + p.x, layer.y + p.y);
    }
    ctx.stroke();
    ctx.restore();
  };

  // Draw all layers
  const imageDrawPromises = [];
  for (const layer of layers) {
    if (!layer || layer.visible === false) continue;
    if (layer.type === 'shape') {
      if (layer.fillType === 'image' && layer.fillImageSrc) {
        imageDrawPromises.push(drawShapeLayerWithImage(layer));
      } else {
        drawShape(layer);
      }
    } else if (layer.type === 'text') {
      drawTextLayer(ctx, layer);
    } else if (layer.type === 'image') {
      imageDrawPromises.push(drawImageLayer(layer));
    } else if (layer.type === 'drawing') {
      drawDrawingLayer(layer);
    }
  }
  
  if (imageDrawPromises.length) {
    await Promise.all(imageDrawPromises);
  }

  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mime, format === 'jpeg' ? quality : undefined);
  return dataUrl;
};
