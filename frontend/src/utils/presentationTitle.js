/**
 * Resolve presentation title for save/display.
 * Prefer AI-enhanced presentationTitle; keep raw user topic as fallback for prompts only.
 */
export function resolvePresentationTitle({
  topic,
  meta,
  apiTitle,
  fallback = "Untitled Presentation",
} = {}) {
  const candidates = [
    meta?.presentationTitle,
    apiTitle,
    meta?.title,
    topic,
    meta?.topic,
  ];

  for (const value of candidates) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (!trimmed) continue;
    if (trimmed.toLowerCase() === "untitled presentation") continue;
    if (trimmed.toLowerCase() === "untitled design") continue;
    return trimmed;
  }

  return fallback;
}
