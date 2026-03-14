import React from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit3, FiFileText, FiLayers } from "react-icons/fi";

/* ---------------- CARD DATA ---------------- */

const cards = [
  {
    icon: <FiEdit3 size={28} />,
    title: "AI Design Generator",
    desc: "Turn prompts into polished layouts in seconds.",
    route: "/create/ai-design",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
  },
  {
    icon: <FiFileText size={28} />,
    title: "Content Writer",
    desc: "Craft on-brand copy, scripts, and campaigns.",
    route: "/create/content-writer",
    image:
      "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=900&q=80",
  },
  {
    icon: <FiLayers size={28} />,
    title: "AI-PPT Creator",
    desc: "Let Ai generate your complete presentation",
    route: "/ai-presentation",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cHJlc2VudGF0aW9ufGVufDB8fDB8fHww",
  },
];

/* ---------------- MAIN PAGE ---------------- */

const CreateCrds = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "calc(100vh - 70px)",
        padding: "32px 24px 60px",
        position: "relative",
        overflow: "hidden",
        background:"#eff6ff",
      }}
    >
      {/* HERO */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          textAlign: "center",
          marginBottom: 34,
        }}
      >
        <h1
          style={{
            fontSize: "2.7rem",
            fontWeight: 800,
            letterSpacing: "-0.6px",
            color:"#0c4a6e",           
            marginBottom: 14,
          }}
        >
          Create Something Amazing
        </h1>

        <p
          style={{
            fontSize: "1.15rem",
            color: "#64748b",
            maxWidth: 620,
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          Choose your creative tool and bring your ideas to life with
          AI-powered design and intelligent automation
        </p>
      </div>

      {/* GRID */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 34,
        }}
      >
        {cards.map((card, i) => (
          <Card key={i} card={card} onStart={() => navigate(card.route)} />
        ))}
      </div>
    </div>
  );
};

/* ---------------- CARD ---------------- */

const Card = ({ card, onStart }) => {
  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => hover(e, true)}
      onMouseLeave={(e) => hover(e, false)}
    >
      <img src={card.image} alt="" style={bgImg} />
      <div style={overlay} />

      <div style={content}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={iconBox}>{card.icon}</div>

          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              {card.title}
            </div>
            <div style={{ fontSize: ".9rem", opacity: 0.85 }}>{card.meta}</div>
          </div>
        </div>

        <p style={desc}>{card.desc}</p>

        <button style={btn} onClick={onStart}>
          Start Creating
        </button>
      </div>
    </div>
  );
};

/* ---------------- STYLES ---------------- */

const cardStyle = {
  position: "relative",
  borderRadius: 24,
  overflow: "hidden",
  minHeight: 300,
  cursor: "pointer",
  backdropFilter: "blur(12px)",
  background: "rgba(15,23,42,.75)",
  border: "1px solid rgba(255,255,255,.15)",
  boxShadow:
    "0 10px 30px rgba(2,6,23,.18), inset 0 0 0 1px rgba(255,255,255,.04)",
  transition: "all .35s cubic-bezier(.22,1,.36,1)",
};

const hover = (e, enter) => {
  e.currentTarget.style.transform = enter
    ? "translateY(-10px) scale(1.015)"
    : "translateY(0) scale(1)";
  e.currentTarget.style.boxShadow = enter
    ? "0 30px 70px rgba(2,6,23,.35)"
    : "0 10px 30px rgba(2,6,23,.18)";
};

const bgImg = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  filter: "brightness(.5)",
};

const overlay = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(0,0,0,0) 20%, rgba(2,6,23,.85) 90%)",
};

const content = {
  position: "relative",
  zIndex: 2,
  padding: 28,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  height: "100%",
  color: "#fff",
};

const iconBox = {
  width: 50,
  height: 50,
  borderRadius: 16,
  background: "rgba(255,255,255,.18)",
  backdropFilter: "blur(10px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const desc = {
  marginTop: 16,
  fontSize: ".98rem",
  lineHeight: 1.6,
  color: "#e2e8f0",
};

const btn = {
  marginTop: 20,
  padding: "12px 0",
  borderRadius: 999,
  border: "none",
  fontWeight: 700,
  background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
  color: "#fff",
  cursor: "pointer",
  transition: ".25s",
};

const blob = (color, left, top, right) => ({
  position: "absolute",
  width: 380,
  height: 380,
  background: color,
  filter: "blur(140px)",
  opacity: 0.18,
  borderRadius: "50%",
  left,
  top,
  right,
  pointerEvents: "none",
});

export default CreateCrds;