import React from "react";
import { useUIStore } from "../../store/useUIStore";
import "./ai-loader-overlay.css";

export default function AILoaderOverlay() {
  const { isLoading, loadingType, loadingMessage } = useUIStore();

  if (!isLoading || loadingType !== "ai") return null;

  return (
    <div className="ai-overlay">
      <div className="ai-loader">
        <div className="ai-orb-container">
          <div className="ai-orb">
            <div className="ai-core"></div>
            <div className="ai-ring ring-1"></div>
            <div className="ai-ring ring-2"></div>
            <div className="ai-ring ring-3"></div>
          </div>
        </div>
        <p>{loadingMessage || "AI is generating your content..."}</p>
      </div>
      <div className="particles-container">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            '--delay': `${Math.random() * 3}s`,
            '--duration': `${3 + Math.random() * 2}s`,
            '--size': `${2 + Math.random() * 4}px`,
            '--distance': `${50 + Math.random() * 100}px`,
            '--position-x': `${Math.random() * 100}%`,
            '--position-y': `${Math.random() * 100}%`,
          }}></div>
        ))}
      </div>
    </div>
  );
}