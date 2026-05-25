/**
 * Keep content-image slide geometry aligned with template + cadence mirror.
 */
import { CONTENT_IMAGE } from "./constants";
import { pickContentImageTemplate } from "./layoutMirror";
import { fitLayersToCanvas } from "./layoutDensityFit";
import { slideShouldHaveImage } from "./layoutStrategyEngine";

const isContentImageTemplate = (name) =>
  /content-image-(left|right)|^image-(left|right)$/.test(
    String(name || "").toLowerCase()
  );

const templateWantsImageLeft = (name) =>
  String(name || "").toLowerCase().includes("content-image-left") ||
  String(name || "").toLowerCase() === "image-left";

export const resolveContentImageTemplate = (slideIndex, meta, storedTemplate) => {
  if (slideIndex < 1) return storedTemplate;
  const canonical = pickContentImageTemplate(slideIndex, meta);
  if (!isContentImageTemplate(storedTemplate)) return canonical;
  return canonical;
};

/** Image flush left vs right for content-image templates. */
export const syncContentImageLayerPositions = (layers, templateName) => {
  if (!Array.isArray(layers) || !isContentImageTemplate(templateName)) {
    return layers;
  }

  const imageLeft = templateWantsImageLeft(templateName);
  const box = imageLeft ? CONTENT_IMAGE.LEFT : CONTENT_IMAGE.RIGHT;

  return layers.map((layer) => {
    if (layer.type !== "image") return layer;
    return {
      ...layer,
      x: box.X,
      y: box.Y,
      width: box.WIDTH,
      height: box.HEIGHT,
      borderRadius: box.RADIUS ?? 0,
      borderWidth: layer.borderWidth ?? 0,
    };
  });
};

export const contentImageGeometryMismatch = (layers, templateName) => {
  if (!isContentImageTemplate(templateName)) return false;

  const image = layers.find((l) => l.type === "image");
  const heading = layers.find((l) => l.role === "heading" || l.role === "title");
  if (!image) return false;

  const imageOnLeft = (Number(image.x) || 0) < 500;
  const wantsImageLeft = templateWantsImageLeft(templateName);

  if (wantsImageLeft !== imageOnLeft) return true;

  if (!heading) return false;
  const textOnLeft = (Number(heading.x) || 0) < 500;
  if (wantsImageLeft && textOnLeft) return true;
  if (!wantsImageLeft && textOnLeft && imageOnLeft) return true;

  return false;
};

/**
 * Fix template name, image side, and text column for one content-image slide.
 */
export const patchContentImageSlide = (slide, slideIndex, meta, slideCount) => {
  const stored = slide.layoutTemplate || slide.layout || "";
  if (!isContentImageTemplate(stored)) return slide;

  const hasImage = (slide.layers || []).some((l) => l.type === "image");
  if (!hasImage || slideIndex === 0) return slide;

  const templateName = resolveContentImageTemplate(slideIndex, meta, stored);
  const wantsImage = slideShouldHaveImage(
    { ...meta, slideCount },
    slideIndex,
    slideCount
  );

  let layers = syncContentImageLayerPositions(slide.layers, templateName);
  layers = fitLayersToCanvas(layers, { ...meta, slideCount }, templateName, slideIndex, {
    hasImageOnSlide: wantsImage,
  });

  return {
    ...slide,
    layoutTemplate: templateName,
    layout: templateName,
    layers,
  };
};
