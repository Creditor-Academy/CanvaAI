import React, { useState } from "react";
import { motion } from "framer-motion";
import "./FAQ.css";

const faqs = [
  {
    q: "What can I create on this platform?",
    a: "You can create professional presentations and edit images using both manual tools and AI-powered features on this platform."
  },
  {
    q: "Can I create presentations using AI?",
    a: "Yes, you can generate presentations automatically using AI. You just need to enter your topic, and AI will create slides for you."
  },
  {
    q: "Can I edit presentations manually?",
    a: "Yes, you can fully edit your presentations by changing text, images, colors, fonts, layouts, and other design elements."
  },
  {
    q: "Does this platform support AI image editing?",
    a: "Yes, you can edit and generate images using AI tools, or you can manually edit images using the built-in editing features."
  },
  {
    q: "Is this platform suitable for beginners?",
    a: "Yes, the platform is designed to be simple and user-friendly, so beginners can easily create presentations and edit images without design experience."
  },
  {
    q: "Can I download my presentations and images?",
    a: "Yes, you can download your presentations and edited images and use them anywhere you want."
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