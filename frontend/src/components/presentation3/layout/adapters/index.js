// adapters/index.js
// Legacy ↔ Semantic IR translation boundary (shadow-only until PR-5).

export { legacySlideToSemanticIR } from "./legacyToSemanticIR.js";
export { semanticIRToLegacySlide } from "./semanticIRToLegacy.js";
export { aiResponseToSemanticIR } from "./aiResponseToSemanticIR.js";
export { semanticIRToLayoutInput } from "./semanticIRToLayoutInput.js";
