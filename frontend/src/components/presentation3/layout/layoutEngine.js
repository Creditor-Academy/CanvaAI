import { nanoid } from "nanoid";
import { normalizeAISlide } from "./layoutNormalizer";
import { resolveLayout } from "./layoutResolver";

// 🆕 NEW IMPORTS
import { selectLayoutStrategy } from "./layoutStrategyEngine";
import { resolveStyles } from "./styleResolver";

/**
 * Convert one AI slide JSON object → a store-ready slide.
 */
export const applyLayoutToSlide = (aiSlide, meta = {}, forceNewId = true, slideIndex = -1, previousTemplate = null) => {
  if (!aiSlide || typeof aiSlide !== "object") {
    throw new Error("[layoutEngine] applyLayoutToSlide received invalid input.");
  }

  // ✅ Step 1: Normalize AI → internal schema
  const normalizedElements = normalizeAISlide(aiSlide);

  // 🧠 Step 2: Decide layout strategy — slide-type aware, non-consecutive rotation
  const strategy = selectLayoutStrategy(
    aiSlide,
    normalizedElements,
    meta,
    slideIndex,
    previousTemplate
  );

  // ✅ Step 3: Resolve layout → assign positions
  const positionedElements = resolveLayout(
    strategy.template,
    normalizedElements,
    meta,
    slideIndex
  );

  // ✅ Step 4: Clean + assign IDs and apply Styles
  const isHero = slideIndex === 0;

const applyStylesToNodes = (nodes, styles) => {
  if (!Array.isArray(nodes)) return nodes;
  return nodes.map((node) => {
    if (node.text !== undefined) {
      const newNode = { ...node };
      if (styles.color !== undefined) newNode.color = styles.color;
      if (styles.fontFamily !== undefined) newNode.fontFamily = styles.fontFamily;
      return newNode;
    }
    if (node.children) {
      return {
        ...node,
        children: applyStylesToNodes(node.children, styles),
      };
    }
    return node;
  });
};

  const layers = positionedElements.map(({ _id, _reservedHeight, role, ...layer }) => {
    if (layer.type === "text") {
      const resolvedRole = role === "heading" ? "title" : role;
      const resolvedStyle = resolveStyles(meta, resolvedRole);
      layer.color = resolvedStyle.color;
      
      if (role === "heading") {
        layer.fontSize = resolvedStyle.fontSize;
        layer.fontWeight = resolvedStyle.fontWeight;
        if (isHero) {
          layer.fontFamily = "Oswald";
          layer.fontSize = Math.min(
            54,
            Math.max(42, (resolvedStyle.fontSize || 40) + 8)
          );
        }
      } else if (role === "subheading") {
        layer.fontSize = resolvedStyle.fontSize;
        layer.fontWeight = resolvedStyle.fontWeight;
      } else {
        layer.fontSize = resolvedStyle.fontSize;
      }
      
      if (layer.content) {
        layer.content = applyStylesToNodes(layer.content, {
          color: layer.color,
          fontFamily: layer.fontFamily
        });
      }
    }
    
    return {
      ...layer,
      role,
      id: nanoid(),
    };
  });

  return {
    id:              forceNewId ? nanoid() : (aiSlide.id || nanoid()),
    background:      meta.theme?.slideBackground || aiSlide.background || aiSlide.backgroundColor || "#ffffff",
    backgroundImage: aiSlide.backgroundImage || null,
    layers,
    layoutProcessed: true,
    layoutTemplate:  strategy.template,
    _layoutTemplate: strategy.template,
  };
};

/**
 * Convert full AI response → slides
 */
export const applyLayoutToPresentation = (aiResponse) => {
  const rawSlides = aiResponse.slides || aiResponse.data?.slides || [];

  const meta = aiResponse?.meta || {};
  let previousTemplate = null;

  return rawSlides.map((slide, index) => {
    const packed = applyLayoutToSlide(slide, meta, true, index, previousTemplate);
    previousTemplate = packed._layoutTemplate;
    const { _layoutTemplate, ...rest } = packed;
    return rest;
  });
};