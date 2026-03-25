import React, { useState, useEffect } from "react";
import usePresentationStore from "../../store/usePresentationStore";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  Sparkles,
  ImageIcon,
  FileText,
  Expand,
  X,
  ChevronLeft,
  Loader2,
  Check
} from "lucide-react";
import "./agent-panel.css";
import * as aiService from "../../../../services/presentation/presentation.service";

const AgentPanel = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    slides,
    presentationId,
    activeSlideId,
    appendSlide,
    updateSlide,
    appendLayersToSlide,
    addImageLayer,
    setActiveSlide
  } = usePresentationStore();

  const [mode, setMode] = useState("default"); // default, generate-slide, expand-slide, generate-image
  const [prompt, setPrompt] = useState("");
  const [mediaType, setMediaType] = useState("No-Media"); // No-Media, AI-Images
  const [selectedSlideId, setSelectedSlideId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to get userId
  const getUserId = () => {
    if (user) return user._id || user.id;

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const localUser = JSON.parse(userStr);
        return localUser._id || localUser.id;
      } catch (e) { return null; }
    }
    return null;
  };

  // Reset state when closing or changing modes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setMode("default");
        setPrompt("");
        setMediaType("No-Media");
        setSelectedSlideId(null);
        setIsGenerating(false);
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBack = () => {
    setMode("default");
    setPrompt("");
    setSelectedSlideId(null);
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isGenerating) return;

    const userId = getUserId();
    console.log("--- AgentPanel: handleSubmit IDs check:", { userId, presentationId });

    if (!userId || !presentationId) {
      alert(`Missing IDs. userId: ${userId || 'null'}, presentationId: ${presentationId || 'null'}. Please ensure you are logged in and the presentation is saved.`);
      return;
    }

    setIsGenerating(true);
    try {
      if (mode === "generate-image") {
        console.log("--- AgentPanel: Generating image with prompt:", prompt);
        const activeSlide = slides.find(s => s.id === activeSlideId);
        const res = await aiService.generateAIImage({
          userId,
          pptId: presentationId,
          userPrompt: prompt,
          activeSlideData: activeSlide
        });
        if (res.url) {
          addImageLayer(null, res.url, res.key);
        }
      } else if (mode === "generate-slide") {
        console.log("--- AgentPanel: Generating slide. Payload check:", { userId, presentationId, prompt, mediaType });
        const presentationData = { slides };
        const res = await aiService.generateAISlide({
          userId,
          pptId: presentationId,
          userPrompt: prompt,
          mediaStyle: mediaType,
          presentationData
        });
        console.log("--- AgentPanel: Generate slide response:", res);
        if (res.success && res.data) {
          appendSlide(res.data);
          // appendSlide already handles normalization and setActiveSlide internally
          // onClose() will ensure the workspace view updates immediately to the new slide
          onClose();
        }
      } else if (mode === "expand-slide") {
        const slideToExpand = slides.find(s => s.id === selectedSlideId);
        console.log("--- AgentPanel: Expanding slide. Payload check:", {
          userId,
          presentationId,
          prompt,
          mediaType,
          slideId: selectedSlideId,
          slideDataSample: slideToExpand?.layers?.[0]?.type
        });

        const res = await aiService.expandAISlide({
          userId,
          pptId: presentationId,
          activeSlide: slideToExpand,
          userPrompt: prompt,
          mediaStyle: mediaType
        });
        console.log("--- AgentPanel: Expand slide response:", res);

        if (res.success && res.data) {
          appendLayersToSlide(selectedSlideId, res.data);
          setActiveSlide(selectedSlideId); // Synchronize view to updated slide
        }
      }

      // Success feedback or just reset
      handleBack();
    } catch (error) {
      console.error("AI Action failed:", error);
      alert("Failed to complete AI action. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderPromptPanel = (showMediaOptions = false) => (
    <div className="agent-prompt-panel animate-in">
      <div className="panel-header">
        <button className="back-btn" onClick={handleBack} disabled={isGenerating}>
          <ChevronLeft size={16} /> Back
        </button>
        <span className="panel-title">
          {mode === "generate-image" && "Generate Image"}
          {mode === "generate-slide" && "Generate Slide"}
          {mode === "expand-slide" && "Expand Slide"}
        </span>
      </div>

      <textarea
        className="agent-prompt-input"
        placeholder={
          mode === "generate-image"
            ? "Describe the image you want..."
            : "Describe the content for your slide..."
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        disabled={isGenerating}
      />

      {showMediaOptions && (
        <div className="media-options">
          <label className="radio-label">
            <input
              type="radio"
              name="mediaType"
              value="No-Media"
              checked={mediaType === "No-Media"}
              onChange={(e) => setMediaType(e.target.value)}
              disabled={isGenerating}
            />
            <span>No-Media</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="mediaType"
              value="Ai-Images"
              checked={mediaType === "Ai-Images"}
              onChange={(e) => setMediaType(e.target.value)}
              disabled={isGenerating}
            />
            <span>Ai-Images</span>
          </label>
        </div>
      )}

      <button
        className="agent-submit-btn"
        onClick={handleSubmit}
        disabled={!prompt.trim() || isGenerating}
      >
        {isGenerating ? (
          <><Loader2 className="spinner" size={18} /> Generating...</>
        ) : (
          "Generate"
        )}
      </button>
    </div>
  );

  const renderSlidePicker = () => (
    <div className="slide-picker-panel animate-in">
      <div className="panel-header">
        <button className="back-btn" onClick={handleBack}>
          <ChevronLeft size={16} /> Back
        </button>
        <span className="panel-title">Select Slide to Expand</span>
      </div>
      <div className="slide-grid">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slide-box ${selectedSlideId === slide.id ? 'selected' : ''}`}
            onClick={() => setSelectedSlideId(slide.id)}
          >
            <span className="slide-num">{index + 1}</span>
            {selectedSlideId === slide.id && <Check className="check-icon" size={14} />}
          </div>
        ))}
      </div>
      <button
        className="panel-next-btn"
        disabled={!selectedSlideId}
        onClick={() => {
          // If we want to show Expand Slide prompt panel
          // The prompt check will be in the next step
        }}
        style={{ display: 'none' }} // We'll use selectedSlideId to toggle view
      >
        Next
      </button>
    </div>
  );

  return (
    <div className={`agent-panel ${isOpen ? "open" : ""}`}>
      <button className="agent-close-btn" onClick={onClose}>
        <X size={18} />
      </button>

      <div className="agent-content">
        <div className="agent-header">
          <div className="agent-title">
            <Sparkles size={20} />
            <h2>AI Assistant</h2>
          </div>
          <p className="agent-subtitle">
            {mode === 'default' ? 'What would you like to do today?' : 'Refine your request'}
          </p>
        </div>

        <div className="agent-flow-container">
          {/* Prompt / Context Panels */}
          {mode === "generate-image" && renderPromptPanel()}
          {mode === "generate-slide" && renderPromptPanel(true)}
          {mode === "expand-slide" && !selectedSlideId && renderSlidePicker()}
          {mode === "expand-slide" && selectedSlideId && renderPromptPanel(true)}

          {/* Primary Action Buttons (Shift down when panel opens) */}
          <div className={`agent-primary-actions ${mode !== 'default' ? 'has-context' : ''}`}>
            <button
              className={`agent-action-card ${mode === 'generate-slide' ? 'active' : ''}`}
              onClick={() => setMode("generate-slide")}
              disabled={isGenerating}
            >
              <div className="icon-box slide-icon">
                <FileText size={24} />
              </div>
              <div className="text-box">
                <h3>Generate Slide</h3>
                <p>Create a full slide from a prompt</p>
              </div>
            </button>

            <button
              className={`agent-action-card ${mode === 'expand-slide' ? 'active' : ''}`}
              onClick={() => setMode("expand-slide")}
              disabled={isGenerating}
            >
              <div className="icon-box expand-icon">
                <Expand size={24} />
              </div>
              <div className="text-box">
                <h3>Expand Slide</h3>
                <p>Add more content to existing slide</p>
              </div>
            </button>

            <button
              className={`agent-action-card ${mode === 'generate-image' ? 'active' : ''}`}
              onClick={() => setMode("generate-image")}
              disabled={isGenerating}
            >
              <div className="icon-box image-icon">
                <ImageIcon size={24} />
              </div>
              <div className="text-box">
                <h3>Generate Image</h3>
                <p>Create AI visuals for your slide</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPanel;
