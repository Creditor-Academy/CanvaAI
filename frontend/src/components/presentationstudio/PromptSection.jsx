import React, { useEffect, useRef, useState } from 'react';
import ThemeCard from './ThemeCard';
import ThemeBrowserModal from './ThemeBrowserModal';
import { PRESENTATION_THEMES } from '../../constants/presentationThemes';
import './styles/PresentationStudio.css';

const FieldLabel = ({ children }) => (
  <label className="ps-field-label">{children}</label>
);

const CustomSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="ps-field-block">
      <FieldLabel>{label}</FieldLabel>

      <div
        className={`ps-custom-select ${isOpen ? 'open' : ''}`}
        ref={wrapperRef}
      >
        <button
          type="button"
          className="ps-custom-select-trigger"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className={value ? 'selected' : 'placeholder'}>
            {value || placeholder}
          </span>
          <span className="ps-custom-select-arrow" />
        </button>

        {isOpen && (
          <div className="ps-custom-select-menu">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`ps-custom-select-option ${
                  value === option.label ? 'active' : ''
                }`}
                onClick={() => {
                  onChange(option.label);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TitleInput = ({ prompt, setPrompt }) => (
  <div className="ps-field-block">
    <div className="ps-field-info-row">
      <FieldLabel>Title</FieldLabel>
      <span className={`ps-char-counter ${prompt.length >= 60 ? 'limit' : ''}`}>
        {prompt.length}/60
      </span>
    </div>
    <textarea
      className="ps-textarea ps-title-input"
      value={prompt}
      onChange={(e) => setPrompt(e.target.value.slice(0, 60))}
      placeholder="Write your presentation title..."
      maxLength={60}
    />
  </div>
);

const OutlineInput = ({ outlineText, setOutlineText }) => (
  <div className="ps-field-block">
    <div className="ps-field-info-row">
      <FieldLabel>Outline (Optional)</FieldLabel>
      <span className={`ps-char-counter ${(outlineText?.length || 0) >= 500 ? 'limit' : ''}`}>
        {outlineText?.length || 0}/500
      </span>
    </div>
    <textarea
      className="ps-textarea ps-outline-input"
      value={outlineText || ""}
      onChange={(e) => setOutlineText(e.target.value.slice(0, 500))}
      placeholder="Write bullet points or structured outline..."
      maxLength={500}
    />
  </div>
);

const ToneSelector = ({ tone, setTone }) => {
  const tones = ['Professional', 'Friendly', 'Creative', 'Corporate'];


  return (
    <CustomSelect
    label="Tone"
      value={tone}
      onChange={setTone}
      placeholder="Select tone"
      options={tones.map((item) => ({
        label: item,
        value: item,
      }))}
    />
  );  
};

const SlideSelector = ({ length, setLength }) => {
  const slides = [2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <CustomSelect
      label="Slides"
      value={length ? `${length} Slides` : ''}
      onChange={(selectedLabel) => {
        const numberOnly = selectedLabel.split(' ')[0];
        setLength(numberOnly);
      }}
      placeholder="Select slide count"
      options={slides.map((num) => ({
        label: `${num} Slides`,
        value: String(num),
      }))}
    />
  );
};

const MediaSelector = ({ mediaStyle, setMediaStyle }) => {
  const options = ['Ai-Images', 'No Media'];
  return (
    <div className="ps-field-block">
      <FieldLabel>Media</FieldLabel>
      <div className="ps-chip-group">
        {options.map((opt) => {
          const isActive = mediaStyle === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setMediaStyle(opt)}
              className={`ps-chip ${isActive ? 'active' : ''}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ImageStyleSelector = ({ imageStyle, setImageStyle }) => {
  const styles = [
    {
      id: 'Realistic',
      label: 'Realistic',
      image:
        'https://i.pinimg.com/736x/5c/b9/62/5cb9627a8d35ff42a96510c58fd68cd2.jpg',
    },
    {
      id: 'Anime',
      label: 'Anime',
      image:
        'https://i.pinimg.com/736x/92/bf/03/92bf03bfcd83247fab3b468fe560cfc7.jpg',
    },
    {
      id: 'Cartoon',
      label: 'Cartoon',
      image:
        'https://i.pinimg.com/736x/69/a2/7e/69a27e12ec3e857c925abb47590dd928.jpg',
    },
    {
      id: 'Sketch',
      label: 'Sketch',
      image:
        'https://i.pinimg.com/736x/98/18/3a/98183a4a3b3e8ea0dec2ff3fb3c33317.jpg',
    },
    {
      id: 'Painting',
      label: 'Painting',
      image:
        'https://i.pinimg.com/736x/ee/3d/9b/ee3d9bbd7bcba1287c2ba4f995423e8c.jpg',
    },
  ];

  return (
    <div className="ps-field-block ps-fade-in ps-image-style-block">
      <FieldLabel>Image Style</FieldLabel>

      <div className="ps-image-style-strip">
        {styles.map((style) => {
          const isActive = imageStyle === style.id;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => setImageStyle(style.id)}
              className={`ps-image-style-card ${isActive ? 'active' : ''}`}
              title={style.label}
            >
              <img
                src={style.image}
                alt={style.label}
                className="ps-image-style-thumb"
              />
              <div className="ps-image-style-overlay">
                <span>{style.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ThemeGrid = ({ selectedTheme, onOpenModal }) => (
  <div className="ps-field-block ps-theme-section">
    <FieldLabel>Theme</FieldLabel>
    <div className="ps-theme-scroll">
      <div className="ps-theme-grid">
        {PRESENTATION_THEMES.map((theme) => (
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
  <div className="ps-generate-wrap">
    <button
      type="button"
      onClick={handleGenerateClick}
      disabled={isGenerating || !canGenerate}
      className="ps-generate-button"
    >
      <span>Generate Presentation</span>
      {isGenerating && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ps-spin"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )}
    </button>
  </div>
);

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
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(null);

  const canGenerate =
    prompt.trim() &&
    tone &&
    length &&
    mediaStyle &&
    (mediaStyle !== "Ai-Images" || imageStyle) &&
    selectedTheme;

  const handleGenerateClick = () => {
    const topic = prompt.trim();
    if (!topic || !selectedTheme) return;

    handleGenerate({
      topic,
      outline: outlineText?.trim() || '',
      meta: {
        tone: tone ? tone.toLowerCase() : 'professional',
        slideCount: length ? Number(length) : 5,
        media: {
          mediaType: mediaStyle,
          mediaStyle: mediaStyle === "Ai-Images" ? imageStyle : undefined,
        },
        theme: {
          name: selectedTheme.name,
          slideBackground: selectedTheme.slideBackground,
          titleColor: selectedTheme.titleColor,
          bodyColor: selectedTheme.bodyColor,
          accentColor: selectedTheme.accentColor,
        },
      },
    });
  };

  return (
    <div className="presentation-studio-creation-hub">
      <div className="presentation-studio-content">
        <div className="ps-layout-grid">
          <div className="ps-panel">
            <div className="ps-panel-header">
              <h3>Presentation Details</h3>
              <p>Set the title, outline, tone, and slide count.</p>
            </div>

            <TitleInput prompt={prompt} setPrompt={setPrompt} />
            <OutlineInput outlineText={outlineText} setOutlineText={setOutlineText} />

            <div className="ps-row-two">
              <ToneSelector tone={tone} setTone={setTone} />
              <SlideSelector length={length} setLength={setLength} />
            </div>
          </div>

          <div className="ps-panel ps-panel-fixed">
            <div className="ps-panel-header">
              <h3>Visual Settings</h3>
              <p>Choose media preferences, image style, and theme.</p>
            </div>

            <MediaSelector mediaStyle={mediaStyle} setMediaStyle={setMediaStyle} />

            {mediaStyle === "Ai-Images" && (
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
        />
      </div>
    </div>
  );
};

export default PromptSection;