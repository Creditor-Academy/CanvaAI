/**
 * Resolve presentation title for save/display.
 * User prompt topic takes priority over API defaults like "Untitled Presentation".
 */
export function resolvePresentationTitle({
  topic,
  meta,
  apiTitle,
  fallback = "Untitled Presentation",
} = {}) {
  const candidates = [topic, meta?.topic, apiTitle];

  for (const value of candidates) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (!trimmed) continue;
    if (trimmed.toLowerCase() === "untitled presentation") continue;
    return trimmed;
  }

  return fallback;
}
