// adapters/semanticIRToLayoutInput.js
// Phase 1 compatibility wrapper — IR deck → legacy layout engine input shape.

import { semanticIRToLegacySlide } from "./semanticIRToLegacy.js";
import { isPlainObject } from "./adapterUtils.js";

/**
 * @param {unknown} irDeck
 * @returns {{ title: string, slides: Object[], meta: Object }}
 */
export const semanticIRToLayoutInput = (irDeck) => {
  if (!isPlainObject(irDeck)) {
    return { title: "Untitled Presentation", slides: [], meta: {} };
  }

  const deck = isPlainObject(irDeck.deck) ? irDeck.deck : {};
  const title =
    (typeof deck.presentationTitle === "string" && deck.presentationTitle.trim()) ||
    "Untitled Presentation";

  const slides = Array.isArray(irDeck.slides)
    ? irDeck.slides.map((slide) => semanticIRToLegacySlide(slide))
    : [];

  const meta = {
    topic: typeof deck.topic === "string" ? deck.topic : "",
    presentationTitle: title,
    ...(deck.tone ? { tone: deck.tone } : {}),
    ...(deck.textAmount ? { textAmount: deck.textAmount } : {}),
  };

  return { title, slides, meta };
};
