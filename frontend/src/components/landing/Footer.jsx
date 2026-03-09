import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      {/* FOOTER MAIN */}

      <div className="footer-main">

        <div className="footer-overlay"></div>

        <div className="footer-content">

          {/* LOGO SECTION */}

          <div className="footer-col logo-section">

            <div className="logo">
              <div className="logo-circle">D</div>
              <h3>Designova</h3>
            </div>

            <p>
              Designova AI helps creators generate presentations,
              documents and visuals instantly with powerful AI tools.
            </p>

            <div className="social-icons">
              <span>f</span>
              <span>t</span>
              <span>▶</span>
            </div>

          </div>

          {/* NAVIGATION */}

          <div className="footer-col">
            <h4>Navigation</h4>
            <a href="#">Home</a>
            <a href="#">Pages</a>
            <a href="#">About Us</a>
            <a href="#">Services</a>
            <a href="#">404</a>
          </div>

          {/* QUICK LINK */}

          <div className="footer-col">
            <h4>Quick Link</h4>
            <a href="#">Contact Us</a>
            <a href="#">FAQs</a>
            <a href="#">Blog</a>
            <a href="#">Gallery</a>
            <a href="#">Pricing</a>
          </div>

          {/* WORK HOURS */}

          <div className="footer-col">
            <h4>Work Hours</h4>

            <p className="work-time">7 AM - 5 PM, Mon - Sat</p>

            <p>
              Our support team is available during working
              hours to help you with Designova AI tools.
            </p>

            <button className="call-btn">Call Us</button>

          </div>

        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} Designova AI — All Rights Reserved
        </div>

      </div>

    </footer>
  );
};

export default Footer;