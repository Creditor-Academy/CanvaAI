import React from "react";
import "./Features.css";
import pptEditor from "../../assets/PPT-EditorExample.png";
import aiDesign from "../../assets/AI design.png";
import aiDesignExample from "../../assets/AI design example.png";
import imageEditor from "../../assets/ImageEditor.png";

const featureCards = [
  {
    eyebrow: "Editing Workspace",
    title: "PPT Editor",
    desc: "Refine every slide with layout controls, content editing, and export-ready presentation tools in one workspace.",
    image: pptEditor,
    imageAlt: "PPT editor interface",
    accent: "Deck Control",
    points: ["Slide editing", "Visual layout tools", "Presentation export"],
    className: "feature-card feature-card-wide",
  },
  {
    eyebrow: "Generation UI",
    title: "AI Design Generator",
    desc: "Prompt-driven design generation with guided settings so teams can move from idea to draft much faster.",
    image: aiDesign,
    imageAlt: "AI design generator interface",
    accent: "Prompt to Design",
    points: ["Prompt workflow", "Style controls", "Fast iterations"],
    className: "feature-card feature-card-tall",
  },
  {
    eyebrow: "Output Example",
    title: "AI Design Example",
    desc: "Show the final quality clearly with polished examples that help users understand the output standard instantly.",
    image: aiDesignExample,
    imageAlt: "AI-generated design example",
    accent: "Preview Ready",
    points: ["Generated concepts", "Campaign visuals"],
    className: "feature-card feature-card-compact",
  },
  {
    eyebrow: "Refinement Tools",
    title: "Image Editor",
    desc: "Tweak, polish, and prepare generated images without leaving the Designova workflow.",
    image: imageEditor,
    imageAlt: "Image editor interface",
    accent: "Edit After Generate",
    points: ["Image cleanup", "Visual adjustments", "Ready for publishing"],
    className: "feature-card feature-card-bottom",
  },
];

const Features = () => {
  return (
    <section className="features-section" id="features">
      <div className="features-container">
        <div
          className="features-header"
        >
          <span className="features-kicker">Core Features</span>
          <h2>Everything you need to create, edit, and ship faster</h2>
          <p>
            Designova combines presentation building, AI generation, polished visual outputs,
            and post-generation editing in one connected workflow.
          </p>
        </div>

        <div
          className="features-grid"
        >
          <div className="features-top-row">
            <div className={featureCards[0].className}>
              <div className="feature-card-shell">
                <div className="feature-card-copy">
                  <span className="feature-accent">{featureCards[0].accent}</span>
                  <span className="feature-eyebrow">{featureCards[0].eyebrow}</span>
                  <h3>{featureCards[0].title}</h3>
                  <p>{featureCards[0].desc}</p>
                  <div className="feature-points">
                    {featureCards[0].points.map((point) => (
                      <span key={point}>{point}</span>
                    ))}
                  </div>
                  <a href="/login" className="feature-link">Open in Designova</a>
                </div>
                <div className="feature-image-wrap">
                  <img src={featureCards[0].image} alt={featureCards[0].imageAlt} className="feature-image" />
                </div>
              </div>
            </div>

            <div className={featureCards[2].className}>
              <div className="feature-card-shell">
                <div className="feature-card-copy">
                  <span className="feature-accent">{featureCards[2].accent}</span>
                  <span className="feature-eyebrow">{featureCards[2].eyebrow}</span>
                  <h3>{featureCards[2].title}</h3>
                  <p>{featureCards[2].desc}</p>
                  <div className="feature-points">
                    {featureCards[2].points.map((point) => (
                      <span key={point}>{point}</span>
                    ))}
                  </div>
                  <a href="/login" className="feature-link">Open in Designova</a>
                </div>
                <div className="feature-image-wrap">
                  <img src={featureCards[2].image} alt={featureCards[2].imageAlt} className="feature-image" />
                </div>
              </div>
            </div>
          </div>

          <div className="features-bottom-row">
            {[featureCards[1], featureCards[3]].map((item) => (
              <div key={item.title} className={`${item.className} feature-card-half`}>
                <div className="feature-card-shell">
                  <div className="feature-card-copy">
                    <span className="feature-accent">{item.accent}</span>
                    <span className="feature-eyebrow">{item.eyebrow}</span>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                    <div className="feature-points">
                      {item.points.map((point) => (
                        <span key={point}>{point}</span>
                      ))}
                    </div>
                    <a href="/login" className="feature-link">Open in Designova</a>
                  </div>
                  <div className="feature-image-wrap">
                    <img src={item.image} alt={item.imageAlt} className="feature-image" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;