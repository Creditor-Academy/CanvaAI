// adapters/aiResponseToSemanticIR.js
// Convert parsed AI deck → SemanticDeckIR with validation snapshot.

import { SEMANTIC_IR_SCHEMA_VERSION } from "../semanticIR/constants.js";
import { normalizeSemanticIR } from "../semanticIR/normalizeSemanticIR.js";
import { validateSemanticIR } from "../semanticIR/validateSemanticIR.js";
import { legacySlideToSemanticIR } from "./legacyToSemanticIR.js";
import { isPlainObject } from "./adapterUtils.js";

/**
 * @param {unknown} parsedDeck - shape from parseAIPresentationResponse: { title, slides, meta }
 * @returns {{ ir: import("../semanticIR/types.js").SemanticDeckIR, validation: { valid: boolean, errors: string[], warnings: string[] } }}
 */
export const aiResponseToSemanticIR = (parsedDeck) => {
  const emptyResult = () => {
    const ir = normalizeSemanticIR({
      schemaVersion: SEMANTIC_IR_SCHEMA_VERSION,
      deck: {},
      slides: [],
    });
    return { ir, validation: validateSemanticIR(ir) };
  };

  try {
    if (!isPlainObject(parsedDeck)) return emptyResult();

    const meta = isPlainObject(parsedDeck.meta) ? parsedDeck.meta : {};
    const slides = Array.isArray(parsedDeck.slides) ? parsedDeck.slides : [];

    const topic =
      (typeof meta.topic === "string" && meta.topic) ||
      (typeof parsedDeck.topic === "string" && parsedDeck.topic) ||
      "";

    const presentationTitle =
      (typeof meta.presentationTitle === "string" && meta.presentationTitle) ||
      (typeof parsedDeck.title === "string" && parsedDeck.title) ||
      "";

    const tone =
      typeof meta.tone === "string" &&
      ["professional", "creative", "minimal", "corporate"].includes(meta.tone)
        ? meta.tone
        : null;

    const textAmountRaw = String(meta.textAmount || "").toLowerCase();
    const textAmount = ["low", "medium", "high"].includes(textAmountRaw)
      ? textAmountRaw
      : null;

    const semanticSlides = slides.map((slide, index) =>
      legacySlideToSemanticIR(slide, meta, index)
    );

    const rawIr = {
      schemaVersion: SEMANTIC_IR_SCHEMA_VERSION,
      deck: {
        topic,
        presentationTitle,
        tone,
        textAmount,
      },
      slides: semanticSlides,
    };

    const ir = normalizeSemanticIR(rawIr);
    const validation = validateSemanticIR(ir);

    return { ir, validation };
  } catch {
    return emptyResult();
  }
};
