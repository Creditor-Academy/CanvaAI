import React, { useState } from 'react';

const PromptSection = ({
  prompt,
  setPrompt,
  tone,
  setTone,
  length,
  setLength,
  mediaStyle,
  setMediaStyle,
  showAdvanced,
  setShowAdvanced,
  outlineText,
  setOutlineText,
  handleGenerate,
  isGenerating,
  generationStep
}) => {
  
  return (
    <div className="presentation-studio-creation-hub">
      <div className="presentation-studio-creation-container">
        <div className="ai-input-box">
          <label className="presentation-studio-label"> Title </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Write your presentation title..."
            className="ai-main-input"
          />
          <hr className='horizontal-line'></hr>
          <label className="presentation-studio-label"> Outline (Optional) </label>
          <textarea
            value={outlineText || ""}
            onChange={(e) => setOutlineText(e.target.value)}
            placeholder="Provide a structured outline for your presentation..."
            className="ai-main-input"
          />
          <div className="ai-toolbar">

            <div className="ai-left-controls">

              {/* Tone */}
              <div className={`ai-dropdown ${showAdvanced === "tone" ? "open" : ""}`}>
                <button
                  className="ai-dropdown-trigger"
                  onClick={() =>
                    setShowAdvanced(prev => prev === "tone" ? null : "tone")
                  }
                >
                  {tone ? tone : "Tone"}
                </button>


                {showAdvanced === "tone" && (
                  <div className="ai-dropdown-menu">
                    {['Professional', 'Friendly', 'Creative', 'Corporate'].map(item => (
                      <div
                        key={item}
                        className="ai-dropdown-item"
                        onClick={() => {
                          if (tone === item) {
                            setTone(null);     // deselect
                          } else {
                            setTone(item);     // select
                          }
                          setShowAdvanced(null);
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>




              {/* Slides */}
              <div className={`ai-dropdown ${showAdvanced === "slides" ? "open" : ""}`}>
                <button
                  className="ai-dropdown-trigger"
                  onClick={() =>
                    setShowAdvanced(prev => prev === "slides" ? null : "slides")
                  }
                >
                  {length ? `${length} Slides` : "Slides"}
                </button>

                {showAdvanced === "slides" && (
                  <div className="ai-dropdown-menu">
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <div
                        key={num}
                        className="ai-dropdown-item"
                        onClick={() => {
                          if (length === String(num)) {
                            setLength(null);
                          } else {
                            setLength(String(num));
                          }
                          setShowAdvanced(null);
                        }}
                      >
                        {num} Slides
                      </div>
                    ))}
                  </div>
                )}
              </div>




              {/* Media */}
              <div className={`ai-dropdown ${showAdvanced === "media" ? "open" : ""}`}>
                <button
                  className="ai-dropdown-trigger"
                  onClick={() =>
                    setShowAdvanced(prev => prev === "media" ? null : "media")
                  }
                >
                  {mediaStyle ? mediaStyle : "Media"}
                </button>

                {showAdvanced === "media" && (
                  <div className="ai-dropdown-menu">
                    {['AI Images', 'No Media'].map(item => (
                      <div
                        key={item}
                        className="ai-dropdown-item"
                        onClick={() => {
                          if (mediaStyle === item) {
                            setMediaStyle(null);
                          } else {
                            setMediaStyle(item);
                          }
                          setShowAdvanced(null);
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>



            </div>




            <button
              onClick={() => {
                handleGenerate({
                  prompt: prompt.trim(),
                  tone: tone ? tone.toLowerCase() : null,
                  length: length ? Number(length) : null,
                  media: mediaStyle === "AI Images",
                  outline: outlineText?.trim() || null
                });
              }}
              disabled={
                isGenerating ||
                !prompt.trim() ||
                !tone ||
                !length ||
                !mediaStyle
              }

              className="ai-generate-top"
            >
              <span className="generate-text">Generate</span>

              {isGenerating && (
                <div className="mini-progress-wrapper">
                  <svg className="mini-progress-ring" width="28" height="28">
                    <circle
                      className="mini-progress-bg"
                      cx="14"
                      cy="14"
                      r="12"
                    />
                    <circle
                      className="mini-progress-bar"
                      cx="14"
                      cy="14"
                      r="12"
                      style={{
                        strokeDashoffset: 75 - (75 * generationStep) / 100
                      }}
                    />
                  </svg>
                  <span className="mini-progress-text">{generationStep}%</span>
                </div>
              )}
            </button>





          </div>

        </div>




      </div>
    </div>
  );
};

export default PromptSection;