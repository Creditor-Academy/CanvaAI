// src/components/landing/Navbar.jsx
import React, { useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import "./Navbar.css";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="navv-root">
      <div className="navv-inner">
        <div className="navv-left">
          <a href="/" className="brand">
            <div className="brand-mark">D</div>
            <div className="brand-text">
              <strong>Designova AI</strong>
            </div>
          </a>
        </div>

        <nav className={`navv-links ${open ? "open" : ""}`}>
          <a href="#features" className="navv-link">Features</a>
          <a href="#how-it-works" className="navv-link">How It Works</a>
          <a href="#faq" className="navv-link">FAQ</a>
        </nav>

        <div className="nav-actions">
          <a className="btn btn-ghost navv-btn" href="/login">Log in</a>

          <button
            className={`hamburger ${open ? "is-active" : ""}`}
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
