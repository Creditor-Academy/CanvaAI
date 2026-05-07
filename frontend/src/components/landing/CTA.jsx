import React from "react";
import "./CTA.css";
import { useNavigate } from "react-router-dom";

const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-shell">
          <div className="cta-badge">Join Designova</div>

          <p className="cta-eyebrow">Athena-crafted creative workflows</p>

          <h2 className="cta-title">
            Build polished visuals with
            <span> timeless brand presence.</span>
          </h2>

          <p className="cta-subtext">
            Designova combines AI generation, presentation building, and visual editing in one refined workspace built for premium output.
          </p>

          <div className="cta-actions">
            <button
              className="cta-button cta-button-primary"
              onClick={() => navigate("/login")}
            >
              Get Started
            </button>

            <button
              className="cta-button cta-button-secondary"
              onClick={() => navigate("/#features")}
            >
              Explore Features
            </button>
          </div>

          <div className="cta-footnote">
            Brand-led typography. Editorial blue palette. Gold-accented premium feel.
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;