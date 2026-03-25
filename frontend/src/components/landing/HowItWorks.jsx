import React from "react";
import { motion } from "framer-motion";
import "./HowItWorks.css";
import howvideo from "../../assets/howvideo.mp4";

const steps = [
  {
    id: 1,
    title: "Choose a Tool",
    text: "Select the AI tool you want to use — presentations or images.",
    color: "#f5c66a"
  },
  {
    id: 2,
    title: "Generate with AI",
    text: "Let AI generate content, edit images, or build Presentation instantly.",
    color: "#5bfcff"
  },
  {
    id: 3,
    title: "Download & Use",
    text: "Download your presentation, image and start using it instantly.",
    color: "#110956"
  }
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.25
    }
  }
};

const item = {
  hidden: { opacity: 0, x: 80 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

export default function HowItWorks() {
  return (
    <section className="hiw-section" id="how-it-works">

      <div className="hiw-container">

        {/* LEFT VIDEO */}

        <motion.div
          className="hiw-left"
          initial={{ opacity: 0, x: -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="hiw-video-frame">

            <div className="hiw-video-bar">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <video
              src={howvideo}
              autoPlay
              muted
              loop
              playsInline
            />

          </div>
        </motion.div>

        {/* RIGHT CONTENT */}

        <div className="hiw-right">

          <div className="hiw-heading">
            <h2>How It Works</h2>
          </div>

          <motion.div
            className="hiw-steps"
            variants={container}
            initial="hidden"
            whileInView="show"
          >

            {steps.map((step) => (
              <motion.div
                className="hiw-step"
                key={step.id}
                variants={item}
              >

                <div
                  className="hiw-icon-circle"
                  style={{ background: step.color }}
                >
                  <div className="hiw-inner-icon">
                    {step.id}
                  </div>
                </div>

                <div className="hiw-content">
                  <h4>{step.title}</h4>
                  <p>{step.text}</p>
                </div>

              </motion.div>
            ))}

          </motion.div>

        </div>

      </div>

    </section>
  );
}