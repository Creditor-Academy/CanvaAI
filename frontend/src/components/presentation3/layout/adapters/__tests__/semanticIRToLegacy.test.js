import { describe, it, expect } from "vitest";
import { legacySlideToSemanticIR } from "../legacyToSemanticIR.js";
import { semanticIRToLegacySlide } from "../semanticIRToLegacy.js";

const legacySlide = {
  layout: "content-image-right",
  layoutType: "content-image-right",
  intent: "content",
  density: "medium",
  title: "Introduction",
  elements: [
    { role: "heading", content: "Hello" },
    { role: "body", content: "World" },
  ],
};

describe("semanticIRToLegacySlide", () => {
  it("restores legacy shape with elements, layout, and intent", () => {
    const ir = legacySlideToSemanticIR(legacySlide, {}, 1);
    const restored = semanticIRToLegacySlide(ir);

    expect(Array.isArray(restored.elements)).toBe(true);
    expect(restored.elements.length).toBeGreaterThan(0);
    expect(typeof restored.layout).toBe("string");
    expect(typeof restored.intent).toBe("string");
    expect(restored.intent).toBe("content");
  });

  it("prefers _legacy restoration and overlays semantic fields", () => {
    const ir = legacySlideToSemanticIR(legacySlide, {}, 1);
    const restored = semanticIRToLegacySlide({
      ...ir,
      narrativeFlow: "analysis",
      layoutHints: { preferredTemplate: "two-column" },
      visualIntent: "text-led",
    });

    expect(restored.intent).toBe("analysis");
    expect(restored.layout).toBe("two-column");
    expect(restored.density).toBe("high");
    expect(restored.elements).toHaveLength(2);
  });

  it("builds legacy slide when _legacy is missing", () => {
    const restored = semanticIRToLegacySlide({
      narrativeFlow: "summary",
      layoutHints: { preferredTemplate: "title-only" },
      visualIntent: "balanced",
      componentGroups: [
        {
          type: "TitleBlock",
          priority: 0,
          content: [{ role: "heading", content: "Fallback title" }],
        },
      ],
    });

    expect(restored.layout).toBe("title-only");
    expect(restored.intent).toBe("summary");
    expect(restored.elements.length).toBe(1);
  });
});
