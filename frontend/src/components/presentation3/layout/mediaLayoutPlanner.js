// layout/mediaLayoutPlanner.js

export function planMediaLayout(slide, meta = {}) {
  const { media = {} } = meta;

  if (!media.enabled) return null;

  const layoutMap = {
    low: "top",
    medium: "left",
    high: "right",
  };

  return {
    position: layoutMap[meta.textAmount] || "left",
    size: meta.textAmount === "low" ? "large" : "medium",
    style: media.style || "default",
  };
}