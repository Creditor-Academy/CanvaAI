import React, { useState } from 'react';
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

const GenerateButton = ({ canGenerate, isGenerating, handleGenerateClick, generationStep }) => (
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', marginBottom: '48px' }}>
    <button
      onClick={handleGenerateClick}
      disabled={isGenerating || !canGenerate}
      style={{
        height: '52px',
        width: '280px',
        background: '#6366F1',
        borderRadius: '12px',
        fontWeight: '600',
        color: 'white',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        opacity: isGenerating || !canGenerate ? 0.5 : 1,
        cursor: isGenerating || !canGenerate ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        fontSize: '16px',
        fontFamily: "'Inter', sans-serif",
        boxShadow: canGenerate && !isGenerating ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
      }}
    >
      <span>Generate Presentation</span>
      {isGenerating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '10px' }}>
            {generationStep}%
          </span>
        </div>
      )}
    </button>
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
    <div className="presentation-studio-creation-hub" style={{ width: '100%' }}>
      <div
        className="presentation-studio-content"
        style={{
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '40px 24px',
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          border: '1px solid #f3f4f6'
        }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .theme-scroll-container::-webkit-scrollbar {
            width: 8px;
          }
          .theme-scroll-container::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 10px;
          }
          .theme-scroll-container::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 10px;
          }
          .theme-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
        `}</style>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', fontFamily: "'Inter', sans-serif" }}>AI Presentation Studio</h2>
          <p style={{ color: '#6B7280', fontSize: '15px', marginTop: '8px', fontFamily: "'Inter', sans-serif" }}>Configure your professional slide deck</p>
        </div>

        <TitleInput prompt={prompt} setPrompt={setPrompt} />
        <OutlineInput outlineText={outlineText} setOutlineText={setOutlineText} />

        <hr style={{ borderTop: '1px solid #f3f4f6', margin: '32px 0' }} />

        <ToneSelector tone={tone} setTone={setTone} />
        <SlideSelector length={length} setLength={setLength} />
        <MediaSelector mediaStyle={mediaStyle} setMediaStyle={setMediaStyle} />

        {mediaStyle === "AI Images" && (
          <ImageStyleSelector imageStyle={imageStyle} setImageStyle={setImageStyle} />
        )}

        <hr style={{ borderTop: '1px solid #f3f4f6', margin: '32px 0' }} />

        <ThemeGrid
          selectedTheme={selectedTheme}
          onOpenModal={(theme) => {
            setPreviewTheme(theme);
            setIsModalOpen(true);
          }}
        />

        <ThemeBrowserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialTheme={previewTheme || selectedTheme}
          onSelect={setSelectedTheme}
        />

        <GenerateButton
          canGenerate={canGenerate}
          isGenerating={isGenerating}
          handleGenerateClick={handleGenerateClick}
          generationStep={generationStep}
        />

      </div>
    </div>
  );
};

export default PromptSection;