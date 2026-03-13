import React, { useState, useEffect } from 'react';
import ThemeCard from './ThemeCard';
import ThemeBrowserModal from './ThemeBrowserModal';
import { PRESENTATION_THEMES } from '../../constants/presentationThemes';

// Modular Subcomponents
// ... (rest of subcomponents)

const TitleInput = ({ prompt, setPrompt }) => (
  <div style={{ marginBottom: '24px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
      Title
    </label>
    <textarea
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      placeholder="Write your presentation title..."
      style={{
        width: '100%',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        minHeight: '56px',
        resize: 'none',
        fontSize: '15px',
        fontFamily: "'Inter', sans-serif",
        outline: 'none',
        transition: 'border-color 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}
      onFocus={(e) => e.target.style.borderColor = '#6366f1'}
      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
    />
  </div>
);

const OutlineInput = ({ outlineText, setOutlineText }) => (
  <div style={{ marginBottom: '32px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
      Outline (Optional)
    </label>
    <textarea
      value={outlineText || ""}
      onChange={(e) => setOutlineText(e.target.value)}
      placeholder="Write bullet points or structured outline..."
      style={{
        width: '100%',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        minHeight: '120px',
        resize: 'none',
        fontSize: '15px',
        fontFamily: "'Inter', sans-serif",
        outline: 'none',
        transition: 'border-color 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}
      onFocus={(e) => e.target.style.borderColor = '#6366f1'}
      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
    />
  </div>
);

const ToneSelector = ({ tone, setTone }) => {
  const tones = ['Professional', 'Friendly', 'Creative', 'Corporate'];
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
        Tone
      </label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tones.map(t => {
          const isActive = tone === t;
          return (
            <button
              key={t}
              onClick={() => setTone(t)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: isActive ? '1px solid transparent' : '1px solid #e5e7eb',
                background: isActive ? '#6366f1' : 'white',
                color: isActive ? 'white' : '#4b5563',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 2px 4px rgba(99,102,241,0.2)' : 'none'
              }}
            >
              {t} {isActive && '●'}
            </button>
          )
        })}
      </div>
    </div>
  );
};

const SlideSelector = ({ length, setLength }) => {
  const slides = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
        Slides
      </label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {slides.map(num => {
          const s = String(num);
          const isActive = length === s;
          return (
            <button
              key={num}
              onClick={() => setLength(s)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: isActive ? '1px solid transparent' : '1px solid #e5e7eb',
                background: isActive ? '#6366f1' : 'white',
                color: isActive ? 'white' : '#4b5563',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 2px 4px rgba(99,102,241,0.2)' : 'none'
              }}
            >
              {num}
            </button>
          )
        })}
      </div>
    </div>
  );
};

const MediaSelector = ({ mediaStyle, setMediaStyle }) => {
  const options = ['AI Images', 'No Media'];
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
        Media
      </label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {options.map(opt => {
          const isActive = mediaStyle === opt;
          return (
            <button
              key={opt}
              onClick={() => setMediaStyle(opt)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: isActive ? '1px solid transparent' : '1px solid #e5e7eb',
                background: isActive ? '#6366f1' : 'white',
                color: isActive ? 'white' : '#4b5563',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 2px 4px rgba(99,102,241,0.2)' : 'none'
              }}
            >
              {opt} {isActive && '●'}
            </button>
          )
        })}
      </div>
    </div>
  );
};

const ImageStyleSelector = ({ imageStyle, setImageStyle }) => {
  const styles = ['Realistic', 'Anime', 'Cartoon', 'Sketch', 'Painting'];
  return (
    <div style={{ marginBottom: '24px', animation: 'fadeIn 0.3s ease-in-out' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
        Image Style
      </label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {styles.map(s => {
          const isActive = imageStyle === s;
          return (
            <button
              key={s}
              onClick={() => setImageStyle(s)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: isActive ? '1px solid transparent' : '1px solid #e5e7eb',
                background: isActive ? '#8b5cf6' : 'white',
                color: isActive ? 'white' : '#4b5563',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '13px',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 2px 4px rgba(139,92,246,0.2)' : 'none'
              }}
            >
              {s} {isActive && '●'}
            </button>
          )
        })}
      </div>
    </div>
  );
};

const ThemeGrid = ({ selectedTheme, onOpenModal }) => (
  <div style={{ marginBottom: '40px' }}>
    <label style={{ display: 'block', marginBottom: '16px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
      Theme
    </label>
    <div className="theme-scroll-container" style={{
      maxHeight: '378px', /* (110px height * 3) + (16px gap * 2) + 16px bottom padding */
      overflowY: 'auto',
      paddingRight: '8px',
      paddingBottom: '16px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {PRESENTATION_THEMES.map(theme => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={selectedTheme?.id === theme.id}
            onClick={() => onOpenModal(theme)}
          />
        ))}
      </div>
    </div>
  </div>
);

const GenerateButton = ({ canGenerate, isGenerating, handleGenerateClick }) => (
  <div style={{ display: "flex", justifyContent: "center", marginTop: "16px", marginBottom: "48px" }}>
    <button
      onClick={handleGenerateClick}
      disabled={isGenerating || !canGenerate}
      style={{
        height: "52px",
        width: "280px",
        background: "#6366F1",
        borderRadius: "12px",
        fontWeight: "600",
        color: "white",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        opacity: isGenerating || !canGenerate ? 0.5 : 1,
        cursor: isGenerating || !canGenerate ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        fontSize: "16px",
        fontFamily: "'Inter', sans-serif",
        boxShadow: canGenerate && !isGenerating ? "0 4px 12px rgba(99,102,241,0.3)" : "none"
      }}
    >
      <span>Generate Presentation</span>
      {isGenerating && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: "spin 1s linear infinite" }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      )}
    </button>
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// MAIN COMPONENT
const PromptSection = ({
  prompt,
  setPrompt,
  tone,
  setTone,
  length,
  setLength,
  mediaStyle,
  setMediaStyle,
  imageStyle,
  setImageStyle,
  selectedTheme,
  setSelectedTheme,
  outlineText,
  setOutlineText,
  handleGenerate,
  isGenerating,
  generationStep,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(null);


  const canGenerate =
    prompt.trim() &&
    tone &&
    length &&
    mediaStyle &&
    (mediaStyle !== "AI Images" || imageStyle) &&
    selectedTheme;

  const handleGenerateClick = () => {
    const topic = prompt.trim();
    if (!topic || !selectedTheme) return;

    handleGenerate({
      topic: topic,
      outline: outlineText?.trim() || "",
      meta: {
        tone: tone ? tone.toLowerCase() : "professional",
        slideCount: length ? Number(length) : 5,
        mediaStyle: mediaStyle === "AI Images" ? "ai-image" : "no-media",
        imageStyle: mediaStyle === "AI Images" ? imageStyle : undefined,
        theme: {
          name: selectedTheme.name,
          slideBackground: selectedTheme.slideBackground,
          titleColor: selectedTheme.titleColor,
          bodyColor: selectedTheme.bodyColor,
          accentColor: selectedTheme.accentColor
        }
      }
    });
  };


  return (
    <div
      className="presentation-studio-creation-hub"
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "40px 20px"
      }}
    >
      <div
        className="presentation-studio-content"
        style={{
          width: "100%",
          maxWidth: "1160px",
          margin: "0 auto",
        }}
      >


        {/* ===== TWO COLUMN LAYOUT ===== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "32px"
          }}
        >

          {/* LEFT COLUMN */}

          <div style={{
            background: "white",
            padding: "32px",
            borderRadius: "24px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column"
          }}>

            <TitleInput prompt={prompt} setPrompt={setPrompt} />

            <OutlineInput
              outlineText={outlineText}
              setOutlineText={setOutlineText}
            />

            <ToneSelector tone={tone} setTone={setTone} />

            <SlideSelector length={length} setLength={setLength} />

          </div>

          {/* RIGHT COLUMN */}

          <div style={{
            background: "white",
            padding: "32px",
            borderRadius: "24px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column"
          }}>

            <MediaSelector
              mediaStyle={mediaStyle}
              setMediaStyle={setMediaStyle}
            />

            {mediaStyle === "AI Images" && (
              <ImageStyleSelector
                imageStyle={imageStyle}
                setImageStyle={setImageStyle}
              />
            )}

            <ThemeGrid
              selectedTheme={selectedTheme}
              onOpenModal={(theme) => {
                setPreviewTheme(theme);
                setIsModalOpen(true);
              }}
            />

          </div>

        </div>

        {/* MODAL */}

        <ThemeBrowserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialTheme={previewTheme || selectedTheme}
          onSelect={setSelectedTheme}
        />

        {/* GENERATE BUTTON */}

        <GenerateButton
          canGenerate={canGenerate}
          isGenerating={isGenerating}
          handleGenerateClick={handleGenerateClick}
        />

      </div>
    </div>
  );
};

export default PromptSection;