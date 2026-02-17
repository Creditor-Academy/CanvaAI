import React from 'react';
import { FiSettings, FiRefreshCw } from 'react-icons/fi';
import { MdAutoAwesome } from 'react-icons/md';

const PromptSection = ({
  prompt,
  setPrompt,
  tone,
  setTone,
  length,
  setLength,
  mediaStyle,
  setMediaStyle,
  useBrandStyle,
  setUseBrandStyle,
  showAdvanced,
  setShowAdvanced,
  outlineText,
  setOutlineText,
  handleGenerate,
  isGenerating,
  generationStep
}) => {
  const tones = ['Professional', 'Friendly', 'Minimal', 'Corporate', 'Creative'];
  const lengths = ['2', '3', '5', '7', '10'];
  const mediaStyles = ['AI Images', 'No Media'];
  // default values (jab page open ho)
  React.useEffect(() => {
    if (!tone) setTone("Professional");
    if (!length) setLength("5");
    if (!mediaStyle) setMediaStyle("AI Images");
  }, []);


  return (
    <div className="presentation-studio-creation-hub">
      <div className="presentation-studio-creation-container">
        {/* <div className="presentation-studio-creation-header">
          <h2 className="presentation-studio-creation-title">Create Your Presentation</h2>
          <p className="presentation-studio-creation-subtitle">
            Describe what you need and let AI generate a beautiful presentation for you
          </p>
        </div> */}

        <div className="ai-hero">
          <h1 className="ai-title">AI Presentation Studio</h1>
          <p className="ai-subtitle">
            Create your stunning presentations with AI in seconds.
          </p>

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



            {/* <div className="ai-controls">

              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                <option>Professional</option>
                <option>Friendly</option>
                <option>Creative</option>
                <option>Corporate</option>
              </select>

              <select value={length} onChange={(e) => setLength(e.target.value)}>
                <option value="5">5 Slides</option>
                <option value="8">8 Slides</option>
                <option value="12">12 Slides</option>
              </select>

              <select value={mediaStyle} onChange={(e) => setMediaStyle(e.target.value)}>
                <option>AI Images</option>
                <option>No Media</option>
              </select> */}

            {/* outline selector */}
            {/* <select
                value={outlineText ? "yes" : "no"}
                onChange={(e) => {
                  if (e.target.value === "yes") {
                    setOutlineText(" ");
                  } else {
                    setOutlineText("");
                  }
                }}
              >
                <option value="no">Outline (Optional)</option>
                <option value="yes">Add Outline</option>
              </select>

            </div> */}

            {/* OUTLINE INPUT APPEARS ONLY IF YES */}
            {/* {outlineText && (
              <textarea
                value={outlineText}
                onChange={(e) => setOutlineText(e.target.value)}
                placeholder="Write slide structure: intro, problem, solution, conclusion..."
                className="ai-outline-box"
              />
            )}


            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="ai-generate-btn"
            >
              {isGenerating ? "Generating..." : "Generate Presentation"}
            </button> */}
            <div className="ai-toolbar">

              <div className="ai-left-controls">

                <select value={tone} onChange={(e) => setTone(e.target.value)}>
                  <option>Professional</option>
                  <option>Friendly</option>
                  <option>Creative</option>
                  <option>Corporate</option>
                </select>

                <select value={length} onChange={(e) => setLength(e.target.value)}>
                  <option value="2">2 Slides</option>
                  <option value="3">3 Slides</option>
                  <option value="4">4 Slides</option>
                  <option value="5">5 Slides</option>
                  <option value="6">6 Slides</option>
                  <option value="7">7 Slides</option>
                  <option value="8">8 Slides</option>
                  <option value="9">9 Slides</option>
                  <option value="10">10 Slides</option>
                </select>


                <select value={mediaStyle} onChange={(e) => setMediaStyle(e.target.value)}>
                  <option>AI Images</option>
                  <option>No Media</option>
                </select>



              </div>

              <button
                onClick={() => {
                  const finalMedia = mediaStyle === "AI Images";

                  handleGenerate({
                    prompt: prompt.trim(),
                    tone: tone.toLowerCase(),
                    length: Number(length),
                    media: finalMedia,
                    outline: outlineText?.trim() || null
                  });
                }}
                disabled={isGenerating || !prompt.trim()}
                className="ai-generate-top"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>


            </div>

          </div>


        </div>

      </div>
    </div>
  );
};

export default PromptSection;