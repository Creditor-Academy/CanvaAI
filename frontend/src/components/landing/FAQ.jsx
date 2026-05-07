import React, { useEffect, useState } from "react";
import "./FAQ.css";

const faqs = [
  {
    category: "Getting Started",
    tag: "Popular",
    q: "What can I create with Designova?",
    a: "You can create presentations, AI-generated designs, posters, and polished visual assets in one workspace.",
    summary: "Presentations, visuals, and branded content from one workflow."
  },
  {
    category: "Editing",
    tag: "Editor",
    q: "Can I edit AI-generated presentations and designs?",
    a: "Yes. After generating a presentation or design, you can refine the content, layout, visuals, and overall styling with the built-in editors.",
    summary: "Refine layout, text, imagery, and final polish after generation."
  },
  {
    category: "AI Workflow",
    tag: "Studio",
    q: "How does the AI Presentation Studio work?",
    a: "You enter a topic or prompt, and Designova helps generate a structured presentation draft that you can customize slide by slide.",
    summary: "Turn a prompt into a structured draft you can edit slide by slide."
  },
  {
    category: "Editing",
    tag: "Visuals",
    q: "What is the Image Editor used for?",
    a: "The Image Editor lets you adjust, refine, and polish visuals after generation so your final output is ready for presentations, branding, or publishing.",
    summary: "Fine-tune generated visuals before export or presentation."
  },
  {
    category: "Billing",
    tag: "Tokens",
    q: "How does token usage work?",
    a: "Certain AI actions use tokens. Designova makes token usage visible so you can track how much is being used across generation and editing tasks.",
    summary: "Track token usage across generation and editing actions."
  },
  {
    category: "Output",
    tag: "Export",
    q: "Can I export my final work?",
    a: "Yes. Once your presentation or visual is ready, you can export the final result for sharing, presenting, or further use.",
    summary: "Export finished work for delivery, sharing, or presentation."
  },
  {
    category: "Getting Started",
    tag: "Access",
    q: "Do I need design experience to use Designova?",
    a: "No. The platform is built for both beginners and professionals, with AI assistance and straightforward editing controls.",
    summary: "Built for beginners, teams, and experienced creators alike."
  },
  {
    category: "Teams",
    tag: "Scale",
    q: "Is Designova suitable for teams and businesses?",
    a: "Yes. Designova works well for students, creators, startups, educators, and business teams that need faster design and presentation workflows.",
    summary: "Fits solo creators, internal teams, educators, and startups."
  }
];

const FAQ = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (!isModalOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  return (
    <section className="faq-section" id="faq">
      <div className="faq-top-svg">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,64L80,74.7C160,85,320,107,480,106.7C640,107,800,85,960,74.7C1120,64,1280,64,1360,64L1440,64V0H0Z"></path>
        </svg>
      </div>

      <div className="faq-container">
        <div className="faq-header">
          <div className="faq-kicker">
            <span className="dot"></span>
            Support Notes
          </div>

          <h2>
            Clear answers before you
            <span> start building</span>
          </h2>

          <p>
            Keep the landing section small. Open one compact card and the full FAQ collection appears in a clean popup.
          </p>
        </div>

        <button type="button" className="faq-trigger-card" onClick={openModal}>
          <div className="faq-trigger-copy">
            <p className="faq-panel-label">FAQ Preview</p>
            <h3>Tap once to open all FAQs.</h3>
            <p className="faq-trigger-text">
              Keep this section small on the page, and show the complete FAQ list only when the user wants it.
            </p>
          </div>

          <div className="faq-trigger-meta">
            <span className="faq-trigger-count">{String(faqs.length).padStart(2, "0")}</span>
            <span className="faq-trigger-cta">Open FAQs</span>
          </div>
        </button>

        <div className={`faq-modal-shell ${isModalOpen ? "visible" : ""}`} aria-hidden={!isModalOpen}>
          <div className="faq-modal-backdrop" onClick={closeModal}></div>

          {isModalOpen && (
            <div className="faq-modal faq-modal-list" role="dialog" aria-modal="true" aria-labelledby="faq-modal-title">
              <button
                type="button"
                className="faq-modal-close"
                onClick={closeModal}
                aria-label="Close FAQ popup"
              >
                ×
              </button>

              <div className="faq-modal-topline">
                <span className="faq-chip">FAQ Library</span>
                <span className="faq-chip faq-chip-muted">{faqs.length} Answers</span>
              </div>

              <div className="faq-modal-header-copy">
                <h3 id="faq-modal-title">All FAQs are visible here.</h3>
                <p className="faq-modal-intro">
                  The landing page stays compact, and the full set of questions opens in one clean blue popup.
                </p>
              </div>

              <div className="faq-modal-list-grid">
                {faqs.map((faq, index) => (
                  <article key={faq.q} className="faq-modal-card">
                    <div className="faq-question-meta">
                      <span className="faq-chip">{faq.category}</span>
                      <span className="faq-chip faq-chip-muted">{faq.tag}</span>
                    </div>

                    <div className="faq-modal-card-head">
                      <div className="faq-index">{String(index + 1).padStart(2, "0")}</div>
                      <div className="faq-copy">
                        <h4>{faq.q}</h4>
                        <p className="faq-summary">{faq.summary}</p>
                      </div>
                    </div>

                    <p className="faq-modal-answer faq-modal-answer-inline">{faq.a}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FAQ;