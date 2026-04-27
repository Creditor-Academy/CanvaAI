import React from "react";
import { motion } from "framer-motion";
import "./Features.css";

import {
  FaFilePowerpoint,
  FaImage,
  FaFileWord
} from "react-icons/fa";

const features = [
  {
    icon: <FaFilePowerpoint />,
    number: "01",
    title: "Presentation Creator",
    desc: "Create beautiful presentations automatically with layouts and smart content."
  },
  {
    icon: <FaImage />,
    number: "02",
    title: "Image Generator",
    desc: "Turn text prompts into high-quality visuals and artwork instantly."
  },
  // {
  //   icon: <FaFileWord />,
  //   number: "03",
  //   title: "Document Generator",
  //   desc: "Generate blogs, reports and professional documents within seconds."
  // }
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.25
    }
  }
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.9
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6
    }
  }
};

const Features = () => {
  return (
    <section className="features-section" id="features">

      <div className="features-container">

        <motion.div
          className="features-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <h2>Features</h2>
          <p>
            Generate, edit and design presentations and images 
            with powerful AI tools.
          </p>
        </motion.div>

        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ amount: 0.3 }}
        >

          {features.map((item, index) => (
            <motion.div
              key={index}
              className="feature-card"
              variants={cardVariants}
              
            >

              <div className="card-shadow"></div>

              <div className="card-box">
                <div className="card-content">

                  <h2>{item.number}</h2>

                  <div className="icon">
                    {item.icon}
                  </div>

                  <h3>{item.title}</h3>

                  <p>{item.desc}</p>

                  <a href="/login">Try Now</a>

                </div>
              </div>

            </motion.div>
          ))}

        </motion.div>

      </div>

      <svg
        className="features-wave"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
      >
        <path
          d="M0,80 
             C240,160 480,0 720,80 
             C960,160 1200,0 1440,80 
             L1440,200 
             L0,200 
             Z"
          fill="#f9fafb"
        />
      </svg>

    </section>
  );
};

export default Features;