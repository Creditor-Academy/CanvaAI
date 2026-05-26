/**
 * Mirrors CanvaAI-Backend/utils/textAmountRules.js
 */

export function normTextAmount(s) {
  const v = String(s || "medium").toLowerCase();
  if (v === "low" || v === "medium" || v === "high") return v;
  return "medium";
}

function resolveSlideCount(meta, slidesLength = 0) {
  const n = Number(meta?.slideCount);
  if (Number.isFinite(n) && n > 0) return n;
  return slidesLength > 0 ? slidesLength : 0;
}

function evenContentSlideIndices(slideCount) {
  const out = [];
  for (let i = 1; i < slideCount; i += 2) out.push(i);
  return out;
}

export function targetImageSlideCount(textAmount, slideCount) {
  const amount = normTextAmount(textAmount);
  if (amount === "low") return slideCount;
  if (amount === "medium") return Math.floor(slideCount / 2);
  return Math.max(0, Math.floor(slideCount / 2) - 1);
}

export function getImageSlideIndices(textAmount, slideCount) {
  const amount = normTextAmount(textAmount);
  const n = Math.max(1, slideCount);

  if (amount === "low") {
    return Array.from({ length: n }, (_, i) => i);
  }

  const k = targetImageSlideCount(amount, n);
  return evenContentSlideIndices(n).slice(0, k);
}

export function slideShouldHaveImage(meta, slideIndex, slidesLength = 0) {
  if (slideIndex < 0) return false;
  if (slideIndex === 0) return true;

  const slideCount = resolveSlideCount(meta) || slidesLength;
  if (slideCount < 1) return false;

  const indices = getImageSlideIndices(meta?.textAmount, slideCount);
  return indices.includes(slideIndex);
}
