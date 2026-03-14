import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
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
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedinIn /></a>
            </div>

          </div>


          

          {/* QUICK LINK */}

          <div className="footer-col">
            <h4>Quick Link</h4>

            <a href="#faq">FAQs</a>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>

          </div>

          {/* CONTACT US */}

          <div className="footer-col contact-section">
            <h4>Contact Us</h4>

            <div className="contact-item">
              <MapPin size={20} />
              <p>123 AI Street, Tech City, 54321</p>
            </div>
            <div className="contact-item">
              <Mail size={20} />
              <p>info@designova.com</p>
            </div>
            <div className="contact-item">
              <Phone size={20} />
              <p>+1 (555) 123-4567</p>
            </div>

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