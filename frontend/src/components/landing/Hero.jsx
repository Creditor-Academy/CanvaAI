import React from "react";
import "./Hero.css";
import herovideo from "../../assets/herovideo.mp4";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="hero">

      {/* SVG background shape */}
      <svg
        className="hero-bg"
        viewBox="0 0 1440 320"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#b3dbff"
          d="M0,120L80,140C160,160,320,200,480,210C640,220,800,200,960,170C1120,140,1280,120,1360,110L1440,100L1440,0L0,0Z"
        ></path>
      </svg>

      <div className="hero-container">

        {/* LEFT CONTENT */}
        <div className="hero-left">

          <h1>
            Design <span> Projects</span><br />
            With Our Designova AI
          </h1>

          <p>
            Generate presentations, documents and visuals instantly
            using powerful AI technology.
          </p>

          <button
            className="cta-btn"
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>

        </div>

        {/* RIGHT SIDE */}
        <div className="hero-right">

          <div className="laptop">

            {/* Laptop Screen */}
            <div className="laptop-screen">

              <div className="camera"></div>

              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="hero-video"
              >
                <source
                  src={herovideo}
                  type="video/webm"
                />
                <source
                  src={herovideo}
                  type="video/mp4"
                />
              </video>

            </div>

            {/* Hinge */}
            <div className="hinge"></div>

            {/* Laptop Base */}
            <div className="laptop-base">
              <div className="trackpad"></div>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
};

export default Hero;