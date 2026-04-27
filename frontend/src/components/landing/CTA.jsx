import React from "react";
import { motion } from "framer-motion";
import "./CTA.css";
import { useNavigate } from "react-router-dom";

const CTA = () => {
  const navigate = useNavigate();
  return (
    <section className="cta-section">

      {/* decorative shapes */}
      <div className="cta-shape-left"></div>
      <div className="cta-shape-right"></div>

      <motion.div
        className="cta-container"
        initial={{ opacity: 0, y: 80, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >

        <motion.div
          className="cta-badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Join Designova 
        </motion.div>

        <motion.h2
          className="cta-title"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Ready to build something amazing?
        </motion.h2>

        <motion.p
          className="cta-subtext"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Start and explore AI-powered creative tools.
        </motion.p>

        <motion.button
          className="cta-button"
          onClick={() => navigate("/login")}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
        >
          Get Started
        </motion.button>

      </motion.div>

    </section>
  );
};

export default CTA;