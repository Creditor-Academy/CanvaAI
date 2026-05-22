// layout/contentDensityManager.js

export function applyContentDensity(slide, density = "medium") {
  if (!slide?.points) return slide;

  let maxPoints = 5;

  if (density === "low") maxPoints = 3;
  if (density === "high") maxPoints = 8;

  return {
    ...slide,
    points: slide.points.slice(0, maxPoints),
  };
}