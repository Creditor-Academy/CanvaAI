import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import "./Footer.css";
import logo from "../../assets/logo.png";

const Footer = () => {
  const quickLinks = [
    { label: "FAQs", href: "#faq" },
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" }
  ];

  const productLinks = [
    { label: "AI PPT Builder", href: "#features" },
    { label: "AI Image/Poster Generator", href: "#features" },
    { label: "PPT Editor", href: "#features" },
    { label: "Image Editor", href: "#features" },
    { label: "Token Tracking", href: "#features" }
  ];

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-content">
          <div className="footer-col logo-section">
            <div className="logo">
              <img src={logo} alt="Designova AI" className="logo-circle" />
              <div className="footer-brand-copy">
                <h3>Designova</h3>
                <span className="footer-brand-tag">Athena creative platform</span>
              </div>
            </div>

            <p className="footer-description">
              Designova helps users generate presentations, create AI images and posters, edit slides and visuals, and keep track of token usage in one focused workspace.
            </p>

            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <span className="social-icon-glyph social-icon-facebook"><FaFacebookF /></span>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="X">
                <span className="social-icon-glyph social-icon-x"><FaXTwitter /></span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <span className="social-icon-glyph social-icon-instagram"><FaInstagram /></span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <span className="social-icon-glyph social-icon-linkedin"><FaLinkedinIn /></span>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <div className="footer-link-list">
              {quickLinks.map((link) => (
                <a key={link.label} href={link.href}>{link.label}</a>
              ))}
            </div>
          </div>

          <div className="footer-col contact-section">
            <h4>Contact Us</h4>

            <div className="contact-item">
              <Mail size={20} />
              <p><a href="mailto:designonva.athena@lmsathena.com">designonva.athena@lmsathena.com</a></p>
            </div>
            <div className="contact-item">
              <Phone size={20} />
              <p>+91 9811773207</p>
            </div>
            <div className="contact-item">
              <MapPin size={20} />
              <p>
                Office<br />
                Athena LMS<br />
                Seattle, WA 98033, United States<br /><br />
                GF-20, Omaxe Square, Jasola District Centre, New Delhi - 110025
              </p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Designova AI. All rights reserved.</span>
          <span>Crafted for focused AI creativity.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;