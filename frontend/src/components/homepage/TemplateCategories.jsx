import { greasemonkey } from "globals";
import React from "react";
import { useNavigate } from "react-router-dom";

const COLORS = {
  primaryBlue: "#60a5fa",
  lightGold: "#f8d77d",
  lightNavy: "#3c82ad",
};
const {
  primaryBlue,
  lightGold,
  lightNavy,
} = COLORS;

const templateTypes = [
  {
    name: "Presentation",
    type: "presentation",
    bg: primaryBlue,
    image:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1000",
  },
  {
    name: "Document",
    type: "document",
    bg: lightGold,
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000",
  },
  {
    name: "Image Editor",
    type: "image",
    bg: lightNavy,
    image:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1000",
  },
];

export default function TemplateTypes() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "50px 40px",  }}>
      
      {/* Heading */}
      <h2
          className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(135deg,#1e40af 0%,#3b82f6 50%,#60a5fa 100%)",
          }}
        >
        Explore templates
      </h2>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {templateTypes.map((item) => (
          <div
            key={item.type}
            onClick={() => navigate(`/templates/${item.type}`)}
            style={{
              background: item.bg,
              borderRadius: "18px",
              padding: "24px",
              position: "relative",
              cursor: "pointer",
              overflow: "hidden",
              transition: "all 0.3s ease",
              height: "130px",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow =
                "0 15px 30px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Text */}
            <div
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#0f172a",
                zIndex: 2,
              }}
            >
              {item.name}
            </div>

            {/* Blended Image */}
            <img
              src={item.image}
              alt={item.name}
              style={{
                position: "absolute",
                right: "0",
                bottom: "0",
                height: "100%",
                width: "55%",
                objectFit: "cover",
                borderTopRightRadius: "18px",
                borderBottomRightRadius: "18px",
                opacity: 0.55,
              }}
            />

            {/* Soft Fade Overlay */}
            <div
              style={{
                position: "absolute",
                right: "0",
                bottom: "0",
                height: "100%",
                width: "55%",
                background:
                  "linear-gradient(to left, rgba(255,255,255,0) 0%, " +
                  item.bg +
                  " 85%)",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}