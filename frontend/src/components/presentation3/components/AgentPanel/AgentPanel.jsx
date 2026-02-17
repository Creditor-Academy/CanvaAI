import React, { useState } from "react";
import usePresentationStore from "../../store/usePresentationStore";
import { Sparkles, Image as ImageIcon, FileText, Expand, Wand2, X } from "lucide-react";
import "./agent-panel.css";

const AgentPanel = ({ isOpen, onClose }) => {
  const { addSlide, addTextLayer, addImageLayer, activeSlideId } = usePresentationStore();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerateSlide = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // TODO: Implement AI slide generation
    setTimeout(() => {
      addSlide();
      setIsGenerating(false);
      setPrompt("");
    }, 1000);
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // TODO: Implement AI image generation
    setTimeout(() => {
      // Placeholder: add a sample image
      addImageLayer("https://via.placeholder.com/400x300?text=AI+Generated");
      setIsGenerating(false);
      setPrompt("");
    }, 1000);
  };

  const handleExpandSlide = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // TODO: Implement AI slide expansion
    setTimeout(() => {
      setIsGenerating(false);
      setPrompt("");
      alert("Slide expansion feature coming soon!");
    }, 1000);
  };

  return (
    <div className={`agent-panel ${isOpen ? "open" : ""}`}>
      {/* Close Button */}
      <button className="agent-close-btn" onClick={onClose}>
        <X size={18} />
      </button>

      <div className="agent-content">
        <div className="agent-header">
          <div className="agent-title">
            <Sparkles size={20} />
            <h2>AI Agent</h2>
          </div>
          <p className="agent-subtitle">What would you like to create?</p>
        </div>

        {/* Prompt Input */}
        <div className="agent-prompt-section">
          <textarea
            className="agent-prompt-input"
            placeholder="Describe what you want to create... (e.g., 'Create a slide about artificial intelligence', 'Generate an image of a sunset over mountains')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
        </div>

        {/* Action Buttons */}
        <div className="agent-actions">
          <button
            className="agent-action-btn"
            onClick={handleGenerateSlide}
            disabled={!prompt.trim() || isGenerating}
          >
            <FileText size={18} />
            <span>Generate Slide</span>
          </button>

          <button
            className="agent-action-btn"
            onClick={handleGenerateImage}
            disabled={!prompt.trim() || isGenerating}
          >
            <ImageIcon size={18} />
            <span>Generate Image</span>
          </button>

          <button
            className="agent-action-btn"
            onClick={handleExpandSlide}
            disabled={!prompt.trim() || isGenerating}
          >
            <Expand size={18} />
            <span>Expand Slide</span>
          </button>

          <button
            className="agent-action-btn agent-action-btn-secondary"
            onClick={() => {
              // TODO: Add more AI features
              alert("More AI features coming soon!");
            }}
          >
            <Wand2 size={18} />
            <span>More AI Tools</span>
          </button>
        </div>

        {/* Loading State */}
        {isGenerating && (
          <div className="agent-loading">
            <div className="agent-spinner"></div>
            <p>Generating with AI...</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="agent-quick-actions">
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
            <button
              className="quick-action-btn"
              onClick={() => setPrompt("Create a professional business slide")}
            >
              Business Slide
            </button>
            <button
              className="quick-action-btn"
              onClick={() => setPrompt("Generate a modern tech illustration")}
            >
              Tech Image
            </button>
            <button
              className="quick-action-btn"
              onClick={() => setPrompt("Create an educational presentation slide")}
            >
              Education Slide
            </button>
            <button
              className="quick-action-btn"
              onClick={() => setPrompt("Generate a creative design image")}
            >
              Creative Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPanel;
