import React from "react";

const HeroVisualPanel = ({ isPreviewVisible, previewContent, pptEditor }) => {
  return (
    <div className="hero-visual-panel">
      <div className="hero-visual-panel-header">
        <div>
          <p className="hero-panel-kicker">Product Preview</p>
          <h3 className="hero-panel-title">Create, edit, and generate in one workspace</h3>
        </div>
        <span className="hero-panel-badge">Live Studio</span>
      </div>

      <div className="hero-visual-stack">
        <div className="hero-main-shot">
          <div className="hero-shot-topbar">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <img src={pptEditor} alt="Designova PPT editor" className="hero-shot-image" />
        </div>

        <div
          className={`hero-floating-card hero-floating-left ${isPreviewVisible ? "is-visible" : "is-hidden"}`}
        >
          <img
            src={previewContent.image}
            alt={previewContent.alt}
            className="hero-floating-image"
          />
          <div className="hero-floating-content">
            <span className="hero-floating-tag">{previewContent.tag}</span>
            <div className="hero-floating-label">{previewContent.label}</div>
            <p className="hero-floating-summary">{previewContent.summary}</p>
          </div>
        </div>

        <div className="hero-token-panel">
          <div className="hero-token-row">
            <span className="hero-token-title">Token Control</span>
            <span className="hero-token-pill">Live Usage</span>
          </div>
          <div className="hero-token-meter">
            <span className="hero-token-fill"></span>
          </div>
          <div className="hero-token-grid">
            <div>
              <strong>Presentations</strong>
              <span>Smart generation</span>
            </div>
            <div>
              <strong>Images</strong>
              <span>Prompt-based assets</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroVisualPanel;