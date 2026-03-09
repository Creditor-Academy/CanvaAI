import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer-wrapper">

      {/* floating logo */}
      <div className="footer-floating-logo">
        ✳
      </div>

      <div className="footer-container">

        {/* center heading */}
        <div className="footer-center">
          <h2 className="footer-title">Designova AI</h2>
          <p className="footer-tagline">
            Where intelligent creativity begins
          </p>

          <div className="footer-buttons">
            <button className="footer-btn primary">Start Creating</button>
            <button className="footer-btn secondary">Join Now</button>
          </div>
        </div>

        <div className="footer-grid">

          {/* contact */}
          <div className="footer-column">
            <h4>Contact</h4>

            <p>
              Address
            </p>

            <p>Email</p>

            <div className="footer-social">
              <a href="#">Twitter ↗</a>
              <a href="#">LinkedIn ↗</a>
              <a href="#">GitHub ↗</a>
            </div>
          </div>

          {/* product */}
          <div className="footer-column">
            <h4>Product</h4>
            <a href="#">Presentation Builder</a>
            <a href="#">Document Generator</a>
            <a href="#">Image Creator</a>
            <a href="#">AI Tools</a>
          </div>

          {/* company */}
          <div className="footer-column">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Help Center</a>
          </div>

        </div>

        {/* bottom legal */}
        <div className="footer-bottom">
          © {new Date().getFullYear()} Athena AI — Empowering Creativity
        </div>

      </div>
    </footer>
  );
};

export default Footer;