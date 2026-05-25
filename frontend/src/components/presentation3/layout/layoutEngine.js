import { nanoid } from "nanoid";
import { normalizeAISlide } from "./layoutNormalizer";
import { resolveLayout } from "./layoutResolver";

// 🆕 NEW IMPORTS
import { selectLayoutStrategy, slideShouldHaveImage } from "./layoutStrategyEngine";
import { resolveStyles } from "./styleResolver";
import { normalizeSlateListContent } from "../editors/slate/slateHelpers";
import { fitLayersToCanvas } from "./layoutDensityFit";
import { expandElementsForTextOnlySlide } from "./layoutTextOnly";
import { getTypographyForRole } from "./layoutTypography";
import { countListItems } from "./layoutUtils";

/**
 * Convert one AI slide JSON object → a store-ready slide.
 */
export const applyLayoutToSlide = (aiSlide, meta = {}, forceNewId = true, slideIndex = -1, previousTemplate = null) => {
  if (!aiSlide || typeof aiSlide !== "object") {
    throw new Error("[layoutEngine] applyLayoutToSlide received invalid input.");
  }

  // ✅ Step 1: Normalize AI → internal schema
  let normalizedElements = normalizeAISlide(aiSlide);

  const mediaEnabled = meta?.media?.enabled !== false;
  const slideCount =
    Number(meta?.slideCount) || (aiSlide?._deckSlideCount ?? 0);

  normalizedElements = expandElementsForTextOnlySlide(
    normalizedElements,
    meta,
    slideIndex,
    slideCount
  );
  const wantsImageOnSlide =
    slideIndex >= 0 &&
    mediaEnabled &&
    slideShouldHaveImage(meta, slideIndex, slideCount);
  const hasImageElement = normalizedElements.some(
    (e) => e.role === "image" || e.type === "image"
  );
  if (!wantsImageOnSlide) {
    normalizedElements = normalizedElements.filter(
      (e) => e.role !== "image" && e.type !== "image"
    );
  } else if (!hasImageElement) {
    normalizedElements = [
      ...normalizedElements,
      {
        role: "image",
        type: "image",
        src: "IMAGE_URL",
        imageUrl: "IMAGE_URL",
        alt: "",
        rotation: 0,
        borderRadius: 0,
        borderWidth: 0,
        borderColor: "#ffffff",
      },
    ];
  }

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
      if (styles.fontSize !== undefined) newNode.fontSize = styles.fontSize;
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

  const templateName = strategy.template;

  const layers = positionedElements.map(({ _id, _reservedHeight, role, ...layer }) => {
    if (layer.type === "text") {
      const resolvedRole = role === "heading" ? "title" : role;
      const resolvedStyle = resolveStyles(meta, resolvedRole);
      const isList = countListItems(layer.content) > 0;
      const typoRole =
        role === "heading" ? "heading" : isList ? "list" : "body";
      const typo = getTypographyForRole(templateName, typoRole, isHero, meta);

      layer.color = resolvedStyle.color;
      layer.fontSize = layer.fontSize ?? typo.fontSize;
      layer.fontWeight = typo.fontWeight ?? layer.fontWeight;

      if (isHero && role === "heading") {
        layer.fontFamily = "Oswald";
        const heroTpl = templateName?.includes("left")
          ? "hero-image-left"
          : "hero-image-right";
        layer.fontSize = getTypographyForRole(heroTpl, "heading", true).fontSize;
      }

      if (layer.content) {
        layer.content = normalizeSlateListContent(
          applyStylesToNodes(layer.content, {
            color: layer.color,
            fontFamily: layer.fontFamily,
            fontSize: layer.fontSize,
          })
        );
      }
    }

    return {
      ...layer,
      role,
      id: nanoid(),
    };
  });

  const fittedLayers = fitLayersToCanvas(layers, meta, templateName, slideIndex, {
    hasImageOnSlide: wantsImageOnSlide,
  });

  return {
    id:              forceNewId ? nanoid() : (aiSlide.id || nanoid()),
    background:      meta.theme?.slideBackground || aiSlide.background || aiSlide.backgroundColor || "#ffffff",
    backgroundImage: aiSlide.backgroundImage || null,
    layers: fittedLayers,
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

  const deckSlideCount = rawSlides.length;

  return rawSlides.map((slide, index) => {
    const slideInput = { ...slide, _deckSlideCount: deckSlideCount };
    const packed = applyLayoutToSlide(
      slideInput,
      { ...meta, slideCount: meta.slideCount || deckSlideCount },
      true,
      index,
      previousTemplate
    );
    previousTemplate = packed._layoutTemplate;
    const { _layoutTemplate, ...rest } = packed;
    return rest;
  });
};