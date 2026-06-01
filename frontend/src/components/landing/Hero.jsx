import React, { useEffect, useState } from "react";
import "./Hero.css";
import { useNavigate } from "react-router-dom";
import aiPresentationStudio from "../../assets/AI Presenation Studio.png";
import pptEditor from "../../assets/PPT.png";
import HeroVisualPanel from "./HeroVisualPanel";

const Hero = () => {
  const navigate = useNavigate();
  const [activePreview, setActivePreview] = useState("studio");
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setIsPreviewVisible(false);

      window.setTimeout(() => {
        setActivePreview((currentPreview) =>
          currentPreview === "studio" ? "poster" : "studio"
        );
        setIsPreviewVisible(true);
      }, 380);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleExploreClick = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const previewContent =
    activePreview === "studio"
      ? {
          label: "AI Presentation Studio",
          image: aiPresentationStudio,
          alt: "AI Presentation Studio interface",
          tag: "Presentations",
          summary: "Generate structured decks with guided inputs, presets, and faster slide creation.",
        }
      : {
          label: "AI Poster Inspiration",
          image: "https://i.pinimg.com/1200x/ee/df/40/eedf409776e505b5c1db7141dfff5317.jpg",
          alt: "AI poster inspiration",
          tag: "Visual Design",
          summary: "Explore creative poster directions and high-impact visual concepts for campaigns.",
        };

  return (
    <section className="hero">
      <svg
        className="hero-bg"
        viewBox="0 0 1440 320"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#9ed0ff"
          d="M0,120L80,140C160,160,320,200,480,210C640,220,800,200,960,170C1120,140,1280,120,1360,110L1440,100L1440,0L0,0Z"
        ></path>
      </svg>

      <div className="hero-orb hero-orb-one"></div>
      <div className="hero-orb hero-orb-two"></div>

      <div className="hero-container">
        <div className="hero-left">

          <div className="hero-eyebrow">Jenkins Testing.</div>

          <h1>
            Build presentations, posters, and visuals
            <span>
              in one <span className="hero-brand-word">Designova studio.</span>
            </span>
          </h1>

          <p>
            Move from idea to polished output with the PPT editor, image editor,
            AI presentation generation, AI poster creation, and transparent token usage
            in a single workflow.
          </p>

          <div className="hero-chip-row">
            <span className="hero-chip">PPT Editor</span>
            <span className="hero-chip">AI Presentation Studio</span>
            <span className="hero-chip">AI Poster Generator</span>
            <span className="hero-chip">Token Tracking</span>
          </div>

          <div className="hero-actions">
            <button
              className="cta-btn cta-btn-primary"
              onClick={() => navigate("/login")}
            >
              Start Creating
            </button>

            <button
              className="cta-btn cta-btn-secondary"
              onClick={handleExploreClick}
            >
              Explore Features
            </button>
          </div>

          <div className="hero-metrics">
            <div className="hero-metric-card">
              <strong>4-in-1</strong>
              <span>Creation workflow</span>
            </div>
            <div className="hero-metric-card">
              <strong>AI + Editor</strong>
              <span>From prompt to polish</span>
            </div>
            <div className="hero-metric-card">
              <strong>Clear Tokens</strong>
              <span>Usage visible per action</span>
            </div>
          </div>

        </div>

        <div className="hero-right">
          <HeroVisualPanel
            isPreviewVisible={isPreviewVisible}
            previewContent={previewContent}
            pptEditor={pptEditor}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
