import React, { useState } from "react";
import { motion } from "framer-motion";
import "./FAQ.css";

const faqs = [
  {
    q: "How do I start a new design?",
    a: "Open the Create section or click Start Creating to begin with templates or a blank canvas."
  },
  {
    q: "Where are my saved templates?",
    a: "Visit the Favorites section where all your saved templates and collections are organized."
  },
  {
    q: "Can I collaborate with my team?",
    a: "Yes. Invite teammates to your workspace and collaborate in real-time."
  },
  {
    q: "How do I contact support?",
    a: "Open Help & Support from the dashboard or email our team anytime."
  },
  {
    q: "Can I export my designs?",
    a: "You can export your designs in PNG, JPG, SVG and PDF formats."
  },
  {
    q: "Is there a free version available?",
    a: "Yes. You can start with the free plan and upgrade anytime."
  }
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.18
    }
  }
};

const item = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.95
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: "easeOut"
    }
  }
};

const FAQ = () => {

  const [open,setOpen] = useState(null);

  const toggle = (i)=>{
    setOpen(open===i ? null : i);
  }

  return (
    <section className="faq-section" id="faq">

      {/* SVG Divider */}

      <div className="faq-top-svg">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,64L80,74.7C160,85,320,107,480,106.7C640,107,800,85,960,74.7C1120,64,1280,64,1360,64L1440,64V0H0Z"></path>
        </svg>
      </div>

      <div className="faq-container">

        {/* HEADER ANIMATION */}

        <motion.div
          className="faq-header"
          initial={{ opacity:0, y:50 }}
          whileInView={{ opacity:1, y:0 }}
          transition={{ duration:0.7 }}
          viewport={{ margin:"-100px" }}
        >

          <div className="faq-kicker">
            <span className="dot"></span> FAQs
          </div>

          <h2>
            Frequently asked <span>questions</span>
          </h2>

          <p>
            Here are some common questions to help you understand our platform better.
          </p>

        </motion.div>

        {/* GRID ANIMATION */}

        <motion.div
          className="faq-grid"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ margin:"-120px" }}
        >

          {faqs.map((f,i)=>(
            <motion.div
              key={i}
              className={`faq-card ${open===i ? "active":""}`}
              onClick={()=>toggle(i)}
              variants={item}
              whileHover={{ scale:1.02 }}
            >

              <div className="faq-question">

                <span className="faq-text">{f.q}</span>

                <span className="icon">
                  {open===i ? "−" : "+"}
                </span>

              </div>

              <div className="faq-answer">
                {f.a}
              </div>

            </motion.div>
          ))}

        </motion.div>

      </div>

    </section>
  );
};

export default FAQ;