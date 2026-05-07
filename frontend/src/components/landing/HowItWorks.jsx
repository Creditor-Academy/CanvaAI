import React, { useEffect, useState } from "react";
import "./HowItWorks.css";
import aiDesign from "../../assets/AI design.png";
import pptEditor from "../../assets/PPT-EditorExample.png";
import aiDesignExample from "../../assets/AI design example.png";
import imageEditor from "../../assets/ImageEditor.png";

const steps = [
  {
    id: 1,
    title: "Choose your workflow",
    text: "Start with AI Design Generator, PPT Editor, or Image Editor depending on the output you want to create.",
    eyebrow: "Step 01",
    status: "Select",
    image: aiDesign,
    imageAlt: "AI design generator interface",
    secondaryImage: pptEditor,
    secondaryLabel: "PPT Workspace",
    highlights: ["Prompt-based start", "Tool selection", "Fast setup"],
  },
  {
    id: 2,
    title: "Generate and refine",
    text: "Create first drafts with AI, then fine-tune slides and visuals using the editor controls built into Designova.",
    eyebrow: "Step 02",
    status: "Refine",
    image: pptEditor,
    imageAlt: "PPT editor interface",
    secondaryImage: imageEditor,
    secondaryLabel: "Image Editor",
    highlights: ["Editable outputs", "Layout controls", "Visual polish"],
  },
  {
    id: 3,
    title: "Export and deliver",
    text: "Turn finished work into presentation-ready decks and polished visuals that are ready for clients, campaigns, and sharing.",
    eyebrow: "Step 03",
    status: "Export",
    image: aiDesignExample,
    imageAlt: "AI design example output",
    secondaryImage: imageEditor,
    secondaryLabel: "Final Polish",
    highlights: ["Ready-to-use output", "Share instantly", "Consistent quality"],
  },
];

export default function HowItWorks() {
  const [activeStepId, setActiveStepId] = useState(steps[0].id);
  const [isPreviewChanging, setIsPreviewChanging] = useState(false);
  const activeStep = steps.find((step) => step.id === activeStepId) ?? steps[0];

  useEffect(() => {
    setIsPreviewChanging(true);
    const timeoutId = window.setTimeout(() => {
      setIsPreviewChanging(false);
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [activeStepId]);

  return (
    <section className="hiw-section" id="how-it-works">
      <div className="hiw-container">
        <div className="hiw-left">
          <div className="hiw-preview-shell">
            <div className="hiw-preview-header">
              <div>
                <span className="hiw-preview-kicker">Current Workflow</span>
                <h3>{activeStep.title}</h3>
              </div>
              <span className="hiw-preview-status">{activeStep.status}</span>
            </div>

            <div className={`hiw-preview-stage ${isPreviewChanging ? "is-changing" : ""}`}>
              <div className="hiw-preview-main-frame" key={`main-${activeStep.id}`}>
                <div className="hiw-preview-bar">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <img
                  src={activeStep.image}
                  alt={activeStep.imageAlt}
                  className="hiw-preview-main-image"
                />
              </div>

              <div className="hiw-preview-floating-card" key={`secondary-${activeStep.id}`}>
                <span className="hiw-preview-floating-label">{activeStep.secondaryLabel}</span>
                <img
                  src={activeStep.secondaryImage}
                  alt={activeStep.secondaryLabel}
                  className="hiw-preview-floating-image"
                />
              </div>
            </div>

            <div className="hiw-preview-footer">
              {activeStep.highlights.map((highlight) => (
                <span key={highlight}>{highlight}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="hiw-right">
          <div className="hiw-heading">
            <span className="hiw-kicker">How It Works</span>
            <h2>How It Works</h2>
            <p>
              Move from idea to finished output in three clear steps using Designova's creation,
              editing, and export workflow.
            </p>
          </div>

          <div className="hiw-steps">
            {steps.map((step) => (
              <button
                type="button"
                className={`hiw-step ${activeStepId === step.id ? "is-active" : ""}`}
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
              >
                <div className="hiw-step-index">0{step.id}</div>

                <div className="hiw-content">
                  <span className="hiw-step-eyebrow">{step.eyebrow}</span>
                  <h4>{step.title}</h4>
                  <p>{step.text}</p>
                </div>

                <span className="hiw-step-status">{step.status}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}