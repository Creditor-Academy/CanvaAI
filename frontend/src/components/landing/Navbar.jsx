// src/components/landing/Navbar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../../assets/logo.png";

const isTokenValid = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLoginClick = (e) => {
    e.preventDefault();
    if (isTokenValid()) {
      navigate("/dashboard/home", { replace: true });
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="navv-root">
      <div className="navv-inner">
        <div className="navv-left">
          <a className="brand">
            <img src={logo} alt="Designova AI" className="brand-logo" />
            <div className="brand-text"> <strong>Designova </strong> </div>

          </a>
        </div>

        <nav className={`navv-links ${open ? "open" : ""}`}>
          <a href="#features" className="navv-link">Features</a>
          <a href="#how-it-works" className="navv-link">How It Works</a>
          <a href="#faq" className="navv-link">FAQ</a>
        </nav>

        <div className="nav-actions">
          <a className="login-btn" href="/login" onClick={handleLoginClick}>Log in</a>

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
