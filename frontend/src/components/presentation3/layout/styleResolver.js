// layout/styleResolver.js
import { DEFAULT_THEME } from "./constants";

export function resolveStyles(meta = {}, role = "body") {
  const theme = meta.theme || DEFAULT_THEME;

  const base = {
    title: {
      fontSize: 30,
      fontWeight: "bold",
      color: theme.titleColor,
    },
    subheading: {
      fontSize: 22,
      fontWeight: "600",
      color: theme.titleColor,
    },
    body: {
      fontSize: 17,
      color: theme.bodyColor,
    },
    eyebrow: {
      fontSize: 14,
      fontWeight: "bold",
      color: theme.accentColor || theme.titleColor,
    },
    caption: {
      fontSize: 12,
      color: theme.bodyColor,
    }
  };

  let styles = base[role] || base.body;

  // Density adjustments
  if (meta.textAmount === "low") {
    styles.fontSize = Math.max(14, styles.fontSize - 1);
  } else if (meta.textAmount === "high") {
    styles.fontSize -= 4;
  }

  // Tone tweaks
  if (meta.tone === "creative") {
    styles.letterSpacing = 1;
  }

  return styles;
}