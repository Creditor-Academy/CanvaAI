// layout/layoutComposer.js

export function composeLayout({
  slide,
  strategy,
  densitySlide,
  mediaPlan,
  styles,
}) {
  return {
    ...slide,
    layout: {
      template: strategy.template,
      density: strategy.density,
      media: mediaPlan,
      styles,
    },
    processedContent: densitySlide,
  };
}