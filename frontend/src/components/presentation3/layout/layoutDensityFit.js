/**
 * Post-layout fitter: scales fonts and restacks text so dense slides stay inside 960×540.
 * Used for textAmount=high (and overflow on medium) without trimming AI content.
 */

import { SLIDE, MARGIN, SAFE, HERO_TEXT } from "./constants";
import {
  SLIDE_CONTENT_BOTTOM,
  estimateTextLayerHeight,
  estimateHeadingHeight,
  isListElement,
  hasVisibleText,
} from "./layoutUtils";

const TEXT_GAP = 10;
const MIN_FONT = { heading: 18, body: 11, list: 10 };

const normalizeTextAmount = (meta) =>
  String(meta?.textAmount || "medium").toLowerCase();

const setLayerFontSize = (layer, fontSize) => {
  const applyToNodes = (nodes) => {
    if (!Array.isArray(nodes)) return nodes;
    return nodes.map((node) => {
      if (!node) return node;
      if (node.text !== undefined) {
        return { ...node, fontSize };
      }
      if (node.children) {
        return { ...node, children: applyToNodes(node.children) };
      }
      return node;
    });
  };

  return {
    ...layer,
    fontSize,
    content: applyToNodes(layer.content),
  };
};

const scaleLayerFont = (layer, factor) => {
  const role = layer.role === "heading" ? "heading" : isListElement(layer) ? "list" : "body";
  const min = MIN_FONT[role];
  const base = layer.fontSize || (role === "heading" ? 28 : 16);
  const next = Math.max(min, Math.round(base * factor));
  return setLayerFontSize(layer, next);
};

/** Content column(s) per template — text-only regions (images unchanged). */
const getContentRegion = (templateName) => {
  const t = (templateName || "").toLowerCase();
  const maxBottom = SLIDE.HEIGHT - MARGIN.BOTTOM;

  if (t.includes("hero")) {
    return {
      startY: 40,
      maxBottom,
      columns: [{ x: HERO_TEXT.X, w: HERO_TEXT.WIDTH }],
    };
  }
  if (
    t.includes("content-image-right") ||
    t.includes("image-right") ||
    t === "image_right_content_left"
  ) {
    const listW = Math.round(SLIDE.WIDTH * 0.38) - MARGIN.LEFT;
    return { startY: SAFE.Y, maxBottom, columns: [{ x: SAFE.X, w: listW }] };
  }
  if (t.includes("content-image-left") || t.includes("image-left")) {
    const listX = MARGIN.LEFT + Math.round(SLIDE.WIDTH * 0.34) + 24;
    const listW = SLIDE.WIDTH - MARGIN.RIGHT - listX;
    return { startY: SAFE.Y, maxBottom, columns: [{ x: listX, w: listW }] };
  }
  if (t.includes("visual-insight") || t.includes("image-focus")) {
    const textW = Math.round(SLIDE.WIDTH * 0.38) - MARGIN.LEFT;
    return { startY: SAFE.Y, maxBottom, columns: [{ x: SAFE.X, w: textW }] };
  }
  if (t.includes("two-column") || t.includes("comparison")) {
    const colW = Math.floor((SAFE.WIDTH - 24) / 2);
    return {
      startY: SAFE.Y,
      maxBottom,
      columns: [
        { x: SAFE.X, w: colW },
        { x: SAFE.X + colW + 24, w: colW },
      ],
    };
  }

  return { startY: SAFE.Y, maxBottom, columns: [{ x: SAFE.X, w: SAFE.WIDTH }] };
};

const sortTextLayers = (layers) => {
  const heading = layers.find((l) => l.role === "heading");
  const rest = layers.filter((l) => l !== heading);
  const paragraphs = rest.filter((l) => !isListElement(l));
  const lists = rest.filter((l) => isListElement(l));
  return { heading, bodyBlocks: [...paragraphs, ...lists] };
};

const stackInColumn = (blocks, column, startY, maxBottom, fontScale) => {
  const out = [];
  let cursorY = startY;

  for (const block of blocks) {
    let layer = scaleLayerFont(block, fontScale);
    const w = column.w;
    const isHeading = layer.role === "heading";
    const h = isHeading
      ? estimateHeadingHeight(layer, w)
      : estimateTextLayerHeight(layer, w);

    const remaining = maxBottom - cursorY;
    if (remaining < 28) break;

    const clampedH = Math.min(h, remaining);
    out.push({
      ...layer,
      x: column.x,
      y: cursorY,
      width: w,
      height: clampedH,
    });
    cursorY += clampedH + TEXT_GAP;
  }

  return { layers: out, bottom: cursorY };
};

const measureStackBottom = (layers, region, fontScale) => {
  const { heading, bodyBlocks } = sortTextLayers(layers);
  const col = region.columns[0];
  const blocks = heading ? [heading, ...bodyBlocks] : bodyBlocks;

  if (region.columns.length === 1) {
    const { bottom } = stackInColumn(blocks, col, region.startY, region.maxBottom, fontScale);
    return bottom;
  }

  const mid = Math.ceil(bodyBlocks.length / 2);
  const leftBlocks = heading ? [heading, ...bodyBlocks.slice(0, mid)] : bodyBlocks.slice(0, mid);
  const rightBlocks = bodyBlocks.slice(mid);

  const left = stackInColumn(leftBlocks, region.columns[0], region.startY, region.maxBottom, fontScale);
  const right = stackInColumn(
    rightBlocks,
    region.columns[1],
    region.startY,
    region.maxBottom,
    fontScale
  );
  return Math.max(left.bottom, right.bottom);
};

const restackTextLayers = (textLayers, region, fontScale) => {
  const { heading, bodyBlocks } = sortTextLayers(textLayers);
  const useTwoCols = region.columns.length > 1 && bodyBlocks.length >= 2;

  if (!useTwoCols) {
    const col = region.columns[0];
    const blocks = heading ? [heading, ...bodyBlocks] : bodyBlocks;
    return stackInColumn(blocks, col, region.startY, region.maxBottom, fontScale).layers;
  }

  const mid = Math.ceil(bodyBlocks.length / 2);
  const leftBlocks = heading ? [heading, ...bodyBlocks.slice(0, mid)] : bodyBlocks.slice(0, mid);
  const rightBlocks = bodyBlocks.slice(mid);

  const left = stackInColumn(leftBlocks, region.columns[0], region.startY, region.maxBottom, fontScale);
  const right = stackInColumn(rightBlocks, region.columns[1], region.startY, region.maxBottom, fontScale);
  return [...left.layers, ...right.layers];
};

/**
 * Fit text layers within the slide canvas; leave images/shapes as-is.
 */
export const fitLayersToCanvas = (layers, meta = {}, templateName = "", slideIndex = -1) => {
  if (!Array.isArray(layers) || layers.length === 0) return layers;
  if (slideIndex === 0) return layers;

  const density = normalizeTextAmount(meta);
  const textLayers = layers.filter((l) => l.type === "text" && hasVisibleText(l));
  if (textLayers.length === 0) return layers;
  if (density === "low") return layers;

  const images = layers.filter((l) => l.type === "image");
  const nonText = layers.filter(
    (l) => l.type !== "text" && l.type !== "image"
  );
  const region = getContentRegion(templateName);

  if (density === "medium") {
    const bottom = measureStackBottom(textLayers, region, 1);
    if (bottom <= region.maxBottom + 4) return layers;
  }

  let fontScale = density === "high" ? 1 : 0.98;
  const maxAttempts = density === "high" ? 12 : 6;

  for (let i = 0; i < maxAttempts; i++) {
    const bottom = measureStackBottom(textLayers, region, fontScale);
    if (bottom <= region.maxBottom + 2) {
      const restacked = restackTextLayers(textLayers, region, fontScale);
      return [...restacked, ...images, ...nonText];
    }
    fontScale *= density === "high" ? 0.9 : 0.92;
    if (fontScale < 0.52) break;
  }

  const restacked = restackTextLayers(textLayers, region, Math.max(0.52, fontScale));
  return [...restacked, ...images, ...nonText];
};
