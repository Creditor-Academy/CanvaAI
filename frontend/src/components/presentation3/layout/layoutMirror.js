/**
 * Deterministic mirror picks — same topic → same hero side; image slides alternate L/R.
 */

export function pickHeroImageLeft(meta = {}) {
  const side = String(meta?.heroImageSide || "").toLowerCase();
  if (side === "left") return true;
  if (side === "right") return false;

  const seed =
    String(meta?.topic || "") +
    String(meta?.presentationTitle || "") +
    String(meta?.slideCount || "");
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % 2 === 1;
}

export function pickHeroTemplate(meta = {}) {
  return pickHeroImageLeft(meta) ? "hero-image-left" : "hero-image-right";
}

/** Image slides: slide_2 = right, slide_4 = left, slide_6 = right, … */
export function pickContentImageLeft(slideIndex) {
  if (slideIndex < 1) return false;
  const imageSlot = Math.floor((slideIndex - 1) / 2);
  return imageSlot % 2 === 1;
}

export function pickContentImageTemplate(slideIndex, _meta = {}) {
  return pickContentImageLeft(slideIndex)
    ? "content-image-left"
    : "content-image-right";
}
