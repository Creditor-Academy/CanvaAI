import { describe, it, expect } from "vitest";
import { legacySlideToSemanticIR } from "../legacyToSemanticIR.js";
import { GEOMETRY_KEYS } from "../../semanticIR/constants.js";

const coverSlide = {
  layout: "hero-image-right",
  layoutType: "hero-image-right",
  intent: "intro",
  density: "low",
  title: "Modern Business",
  elements: [
    { role: "heading", content: [{ type: "paragraph", children: [{ text: "Title" }] }] },
    { role: "image", src: "https://example.com/img.jpg", x: 10, y: 20, width: 400, height: 300 },
    {
      role: "body",
      content: [{ type: "bulleted-list", children: [{ type: "list-item", children: [{ text: "A" }] }] }],
    },
  ],
};

describe("legacySlideToSemanticIR", () => {
  it("converts slide with mapped semantic fields", () => {
    const ir = legacySlideToSemanticIR(coverSlide, { topic: "Biz" }, 0);

    expect(ir.slideFamily).toBe("Hero");
    expect(ir.narrativeFlow).toBe("intro");
    expect(ir.visualIntent).toBe("visual-led");
    expect(ir.layoutHints?.preferredTemplate).toBe("hero-image-right");
    expect(ir.emphasisHierarchy[0]).toBe("Modern Business");
  });

  it("infers component groups without geometry", () => {
    const ir = legacySlideToSemanticIR(coverSlide, {}, 0);
    const types = ir.componentGroups.map((g) => g.type);

    expect(types).toContain("TitleBlock");
    expect(types).toContain("HeroVisual");
    expect(types).toContain("BulletCluster");

    for (const group of ir.componentGroups) {
      for (const item of group.content || []) {
        for (const key of GEOMETRY_KEYS) {
          expect(item[key]).toBeUndefined();
        }
      }
      for (const key of GEOMETRY_KEYS) {
        expect(group[key]).toBeUndefined();
      }
    }
  });

  it("preserves _legacy snapshot", () => {
    const ir = legacySlideToSemanticIR(coverSlide, {}, 0);
    expect(ir._legacy?.elements).toHaveLength(3);
    expect(ir._legacy?.elements[1]?.x).toBe(10);
  });

  it("coerces invalid enums via normalization", () => {
    const ir = legacySlideToSemanticIR(
      { intent: "not-a-flow", density: "extreme", elements: [] },
      {},
      1
    );
    expect(ir.narrativeFlow).toBe("content");
    expect(ir.visualIntent).toBe("balanced");
  });

  it("maps density to visual intent", () => {
    const high = legacySlideToSemanticIR({ density: "high", elements: [] }, {}, 1);
    expect(high.visualIntent).toBe("text-led");
  });
});
