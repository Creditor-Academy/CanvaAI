import { describe, it, expect } from "vitest";
import {
  SEMANTIC_IR_SCHEMA_VERSION,
  isSemanticIRv2,
  createEmptySemanticDeck,
  normalizeSemanticIR,
  validateSemanticIR,
} from "../index.js";

describe("semanticIR PR-3", () => {
  it("isSemanticIRv2 matches schema version exactly", () => {
    expect(isSemanticIRv2({ schemaVersion: SEMANTIC_IR_SCHEMA_VERSION, slides: [] })).toBe(
      true
    );
    expect(isSemanticIRv2({ schemaVersion: "semir.v1", slides: [] })).toBe(false);
    expect(isSemanticIRv2(null)).toBe(false);
  });

  it("normalizeSemanticIR strips geometry and coerces invalid enums", () => {
    const normalized = normalizeSemanticIR({
      schemaVersion: "legacy",
      slides: [
        {
          slideFamily: "NotAFamily",
          visualIntent: "invalid",
          importance: 2,
          componentGroups: [{ type: "TitleBlock", x: 10, y: 20, width: 100, height: 50 }],
        },
      ],
    });

    expect(normalized.slides[0].slideFamily).toBe(null);
    expect(normalized.slides[0].visualIntent).toBe(null);
    expect(normalized.slides[0].importance).toBe(1);
    expect(normalized.slides[0].componentGroups[0].x).toBeUndefined();
    expect(normalized.slides[0].componentGroups[0].type).toBe("TitleBlock");
  });

  it("validateSemanticIR never throws and fail-closed on catastrophic shape", () => {
    expect(validateSemanticIR(null).valid).toBe(false);
    expect(validateSemanticIR({ deck: {} }).valid).toBe(false);
  });

  it("validateSemanticIR warns on schema mismatch and geometry fields", () => {
    const result = validateSemanticIR({
      schemaVersion: "semir.v1",
      slides: [
        {
          componentGroups: [{ type: "TitleBlock", x: 1 }],
        },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("schemaVersion mismatch"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("geometry field"))).toBe(true);
  });

  it("createEmptySemanticDeck provides stable defaults", () => {
    const deck = createEmptySemanticDeck();
    expect(deck.schemaVersion).toBe(SEMANTIC_IR_SCHEMA_VERSION);
    expect(Array.isArray(deck.slides)).toBe(true);
    expect(deck.slides).toHaveLength(0);
  });
});
