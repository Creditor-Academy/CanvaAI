import { getFilterCSS, hexToRgba } from '../../../utils/styleUtils';

/**
 * Helper to draw rounded rectangle
 */
export const drawRoundedRect = (ctx, x, y, w, h, r) => {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

/**
 * Draw shape path on canvas context
 */
export const drawShapePath = (ctx, shape, x, y, w, h, drawRoundedRectFn) => {
  if (shape === 'rectangle') {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.closePath();
  } else if (shape === 'roundedRectangle') {
    drawRoundedRectFn(ctx, x, y, w, h, 16);
  } else if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(x + Math.min(w, h) / 2, y + Math.min(w, h) / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
    ctx.closePath();
  } else if (shape === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.closePath();
  } else if (shape === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  } else if (shape === 'rightTriangle') {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  } else if (shape === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();
  } else if (shape === 'pentagon') {
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y);
    ctx.lineTo(x + w * 0.95, y + h * 0.38);
    ctx.lineTo(x + w * 0.77, y + h);
    ctx.lineTo(x + w * 0.23, y + h);
    ctx.lineTo(x + w * 0.05, y + h * 0.38);
    ctx.closePath();
  } else if (shape === 'hexagon') {
    ctx.beginPath();
    ctx.moveTo(x + w * 0.25, y);
    ctx.lineTo(x + w * 0.75, y);
    ctx.lineTo(x + w, y + h * 0.5);
    ctx.lineTo(x + w * 0.75, y + h);
    ctx.lineTo(x + w * 0.25, y + h);
    ctx.lineTo(x, y + h * 0.5);
    ctx.closePath();
  } else if (shape === 'star') {
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y);
    ctx.lineTo(x + w * 0.61, y + h * 0.35);
    ctx.lineTo(x + w * 0.98, y + h * 0.35);
    ctx.lineTo(x + w * 0.68, y + h * 0.57);
    ctx.lineTo(x + w * 0.79, y + h * 0.91);
    ctx.lineTo(x + w * 0.5, y + h * 0.70);
    ctx.lineTo(x + w * 0.21, y + h * 0.91);
    ctx.lineTo(x + w * 0.32, y + h * 0.57);
    ctx.lineTo(x + w * 0.02, y + h * 0.35);
    ctx.lineTo(x + w * 0.39, y + h * 0.35);
    ctx.closePath();
  } else if (shape === 'star6') {
    ctx.beginPath();
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const outerRadius = Math.min(w, h) / 2;
    const innerRadius = outerRadius * 0.5;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const px = centerX + radius * Math.cos(angle);
      const py = centerY + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'heart') {
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h * 0.85);
    ctx.bezierCurveTo(x + w * 0.15, y + h * 0.85, x + w * 0.15, y + h * 0.50, x + w * 0.15, y + h * 0.50);
    ctx.bezierCurveTo(x + w * 0.15, y + h * 0.15, x + w * 0.35, y, x + w * 0.5, y + h * 0.15);
    ctx.bezierCurveTo(x + w * 0.65, y, x + w * 0.85, y + h * 0.15, x + w * 0.85, y + h * 0.50);
    ctx.bezierCurveTo(x + w * 0.85, y + h * 0.50, x + w * 0.85, y + h * 0.85, x + w * 0.5, y + h * 0.85);
    ctx.closePath();
  } else if (shape === 'arrow') {
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.3);
    ctx.lineTo(x + w * 0.6, y + h * 0.3);
    ctx.lineTo(x + w * 0.6, y + h * 0.1);
    ctx.lineTo(x + w, y + h * 0.5);
    ctx.lineTo(x + w * 0.6, y + h * 0.9);
    ctx.lineTo(x + w * 0.6, y + h * 0.7);
    ctx.lineTo(x, y + h * 0.7);
    ctx.closePath();
  } else if (shape === 'arrowLeft') {
    ctx.beginPath();
    ctx.moveTo(x + w, y + h * 0.3);
    ctx.lineTo(x + w * 0.4, y + h * 0.3);
    ctx.lineTo(x + w * 0.4, y + h * 0.1);
    ctx.lineTo(x, y + h * 0.5);
    ctx.lineTo(x + w * 0.4, y + h * 0.9);
    ctx.lineTo(x + w * 0.4, y + h * 0.7);
    ctx.lineTo(x + w, y + h * 0.7);
    ctx.closePath();
  } else if (shape === 'arrowUp') {
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h);
    ctx.lineTo(x + w * 0.3, y + h * 0.4);
    ctx.lineTo(x + w * 0.1, y + h * 0.4);
    ctx.lineTo(x + w * 0.5, y);
    ctx.lineTo(x + w * 0.9, y + h * 0.4);
    ctx.lineTo(x + w * 0.7, y + h * 0.4);
    ctx.lineTo(x + w * 0.7, y + h);
    ctx.closePath();
  } else if (shape === 'arrowDown') {
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y);
    ctx.lineTo(x + w * 0.3, y + h * 0.6);
    ctx.lineTo(x + w * 0.1, y + h * 0.6);
    ctx.lineTo(x + w * 0.5, y + h);
    ctx.lineTo(x + w * 0.9, y + h * 0.6);
    ctx.lineTo(x + w * 0.7, y + h * 0.6);
    ctx.lineTo(x + w * 0.7, y);
    ctx.closePath();
  } else if (shape === 'cloud') {
    ctx.beginPath();
    ctx.moveTo(x + w * 0.25, y + h * 0.5);
    ctx.bezierCurveTo(x + w * 0.1, y + h * 0.5, x, y + h * 0.35, x + w * 0.1, y + h * 0.25);
    ctx.bezierCurveTo(x + w * 0.1, y + h * 0.1, x + w * 0.25, y, x + w * 0.4, y + h * 0.1);
    ctx.bezierCurveTo(x + w * 0.5, y, x + w * 0.6, y + h * 0.1, x + w * 0.6, y + h * 0.25);
    ctx.bezierCurveTo(x + w * 0.9, y + h * 0.25, x + w, y + h * 0.4, x + w * 0.85, y + h * 0.5);
    ctx.bezierCurveTo(x + w * 0.95, y + h * 0.6, x + w * 0.9, y + h * 0.75, x + w * 0.75, y + h * 0.8);
    ctx.bezierCurveTo(x + w * 0.7, y + h * 0.95, x + w * 0.5, y + h, x + w * 0.35, y + h * 0.9);
    ctx.bezierCurveTo(x + w * 0.2, y + h * 0.95, x + w * 0.05, y + h * 0.85, x + w * 0.1, y + h * 0.7);
    ctx.bezierCurveTo(x, y + h * 0.6, x + w * 0.05, y + h * 0.5, x + w * 0.15, y + h * 0.5);
    ctx.closePath();
  } else {
    drawRoundedRectFn(ctx, x, y, w, h, 8);
  }
};

/**
 * Draw text layer on canvas
 */
export const drawTextLayer = (ctx, layer) => {
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

  ctx.fillStyle = layer.color || '#000000';
  const fontWeight = layer.fontWeight || 'normal';
  const fontSize = layer.fontSize || 16;
  const fontFamily = layer.fontFamily || 'Arial';
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';

  if (layer.fontStyle === 'italic') {
    ctx.font = `italic ${fontWeight} ${fontSize}px ${fontFamily}`;
  }

  const textAlign = layer.textAlign || 'left';
  ctx.textAlign = textAlign;

  const x = layer.x + 4;
  const y = layer.y + 4;
  const width = Math.max(10, (layer.width || 300) - 8);

  // Calculate draw X based on alignment
  let drawX = x;
  if (textAlign === 'center') {
    drawX = x + width / 2;
  } else if (textAlign === 'right') {
    drawX = x + width;
  }

  const text = layer.text || '';
  const lines = text.split(/\n/);
  const wrappedLines = [];

  // Simple wrapping logic
  for (const line of lines) {
    const words = line.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > width && currentLine) {
        wrappedLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    wrappedLines.push(currentLine);
  }

  let offsetY = 0;
  for (const line of wrappedLines) {
    ctx.fillText(line, drawX, y + offsetY, width);

    if (layer.textDecoration === 'underline') {
      const metrics = ctx.measureText(line);
      const underlineY = y + offsetY + fontSize;
      let lineStartX = drawX;

      if (textAlign === 'center') {
        lineStartX = drawX - metrics.width / 2;
      } else if (textAlign === 'right') {
        lineStartX = drawX - metrics.width;
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(lineStartX, underlineY + 2);
      ctx.lineTo(lineStartX + metrics.width, underlineY + 2);
      ctx.lineWidth = Math.max(1, Math.floor(fontSize / 12));
      ctx.strokeStyle = layer.color || '#000000';
      ctx.stroke();
      ctx.restore();
    }

    offsetY += fontSize * 1.3;
  }

  ctx.restore();
};
