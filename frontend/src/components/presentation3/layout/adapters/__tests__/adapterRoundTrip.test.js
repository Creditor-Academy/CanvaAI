import { describe, it, expect } from "vitest";
import { legacySlideToSemanticIR } from "../legacyToSemanticIR.js";
import { semanticIRToLegacySlide } from "../semanticIRToLegacy.js";
import { aiResponseToSemanticIR } from "../aiResponseToSemanticIR.js";
import { semanticIRToLayoutInput } from "../semanticIRToLayoutInput.js";
import { GEOMETRY_KEYS } from "../../semanticIR/constants.js";

describe("adapter round trip", () => {
  const legacySlide = {
    layout: "title-content",
    intent: "content",
    density: "medium",
    title: "Quarterly Review",
    elements: [
      { role: "heading", content: [{ type: "paragraph", children: [{ text: "Q1" }] }] },
      { role: "body", x: 99, y: 88, width: 200, height: 100, content: "Details" },
    ],
  };

  it("legacy → IR → legacy survives core fields", () => {
    const ir = legacySlideToSemanticIR(legacySlide, {}, 1);
    const restored = semanticIRToLegacySlide(ir);

    expect(restored.layout).toBe("title-content");
    expect(restored.intent).toBe("content");
    expect(restored.title).toBe("Quarterly Review");
    expect(Array.isArray(restored.elements)).toBe(true);
  });

  it("IR component groups never contain geometry", () => {
    const ir = legacySlideToSemanticIR(legacySlide, {}, 1);

    for (const group of ir.componentGroups) {
      for (const key of GEOMETRY_KEYS) {
        expect(group[key]).toBeUndefined();
      }
      for (const item of group.content || []) {
        for (const key of GEOMETRY_KEYS) {
          expect(item[key]).toBeUndefined();
        }
      }
    }
  });

  it("deck adapter round trip produces layout input shape", () => {
    const parsed = {
      title: "Deck Title",
      meta: { topic: "Sales", textAmount: "medium" },
      slides: [legacySlide],
    };

    const { ir, validation } = aiResponseToSemanticIR(parsed);
    expect(validation.valid).toBe(true);
    expect(ir.slides).toHaveLength(1);

    const layoutInput = semanticIRToLayoutInput(ir);
    expect(layoutInput.title).toBe("Deck Title");
    expect(layoutInput.slides).toHaveLength(1);
    expect(layoutInput.meta.topic).toBe("Sales");
    expect(layoutInput.slides[0].elements.length).toBeGreaterThan(0);
  });

  it("does not throw on invalid input", () => {
    expect(() => semanticIRToLegacySlide(null)).not.toThrow();
    expect(() => aiResponseToSemanticIR(null).validation.valid).not.toThrow();
    expect(aiResponseToSemanticIR(null).validation.valid).toBe(true);
  });
});
