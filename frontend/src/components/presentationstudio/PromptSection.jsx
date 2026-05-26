import React, { useEffect, useRef, useState } from 'react';
import ThemeCard from './ThemeCard';
import ThemeBrowserModal from './ThemeBrowserModal';
import { PRESENTATION_THEMES } from '../../constants/presentationThemes';
import usePresentationFormStore from './usePresentationFormStore';
import TextAmountSelector from './TextAmountSelector';
import MediaSelector from './MediaSelector';
import './styles/PresentationStudio.css';

const FieldLabel = ({ children, required }) => (
  <label className="ps-field-label">
    {children}
    {required && <span className="ps-required-star"> *</span>}
  </label>
);

const CustomSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
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
    <div className={`ps-field-block ${isOpen ? 'dropdown-open' : ''}`}>
      <FieldLabel required={required}>{label}</FieldLabel>

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
      <FieldLabel required>Title</FieldLabel>
      <span className={`ps-char-counter ${prompt.length >= 100 ? 'limit' : ''}`}>
        {prompt.length >= 100 ? 'Limit reached' : `${prompt.length}/100`}
      </span>
    </div>
    <textarea
      className="ps-textarea ps-title-input"
      value={prompt}
      onChange={(e) => setPrompt(e.target.value.slice(0, 100))}
      placeholder="Write your presentation title..."
      maxLength={100}
    />
  </div>
);

const OutlineInput = ({ outlineText, setOutlineText }) => (
  <div className="ps-field-block">
    <div className="ps-field-info-row">
      <FieldLabel required>Outline</FieldLabel>
      <span className={`ps-char-counter ${(outlineText?.length || 0) >= 1000 ? 'limit' : ''}`}>
        {outlineText?.length || 0}/1000
      </span>
    </div>
    <textarea
      className="ps-textarea ps-outline-input"
      value={outlineText || ""}
      onChange={(e) => setOutlineText(e.target.value.slice(0, 1000))}
      placeholder="Write bullet points or structured outline..."
      maxLength={1000}
    />
  </div>
);

const ToneSelector = ({ tone, setTone }) => {
  const tones = ['Professional', 'Friendly', 'Creative', 'Corporate'];

  return (
    <CustomSelect
      label="Tone"
      required
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
      required
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


const ThemeGrid = ({ selectedTheme, onOpenModal }) => (
  <div className="ps-field-block ps-theme-section">
    <FieldLabel required>Theme</FieldLabel>
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
  outlineText,
  setOutlineText,
  useBrandStyle,
  setUseBrandStyle,
  handleGenerate,
  isGenerating,
}) => {
  const {
    textAmount,
    media,
    selectedTheme,
    setTextAmount,
    setMediaStyle,
    setTheme,
  } = usePresentationFormStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(null);

  const canGenerate =
    prompt.trim() &&
    outlineText?.trim() &&
    tone &&
    length &&
    media?.style &&
    selectedTheme;

  const handleGenerateClick = () => {
    const topic = prompt.trim();
    if (!topic || !outlineText?.trim() || !tone || !length || !media?.style || !selectedTheme) return;

    const payload = {
      topic,
      tone: tone ? tone.toLowerCase() : 'professional',
      length: String(length),
      mediaStyle: media.style,
      useBrandStyle,
      outlineText: outlineText?.trim() || '',
      textAmount,
      theme: {
        name: selectedTheme.name,
        slideBackground: selectedTheme.slideBackground,
        titleColor: selectedTheme.titleColor,
        bodyColor: selectedTheme.bodyColor,
        accentColor: selectedTheme.accentColor,
      },
      meta: {
        topic,
        tone: tone ? tone.toLowerCase() : 'professional',
        textAmount,
        media: {
          enabled: media.enabled,
          style: media.style,
        },
        slideCount: length ? Number(length) : 5,
        theme: {
          name: selectedTheme.name,
          slideBackground: selectedTheme.slideBackground,
          titleColor: selectedTheme.titleColor,
          bodyColor: selectedTheme.bodyColor,
          accentColor: selectedTheme.accentColor,
        },
      },
    };

    handleGenerate(payload);
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

            <TextAmountSelector value={textAmount} onChange={setTextAmount} />
            <MediaSelector value={media.style} onChange={setMediaStyle} />
          </div>

          <div className="ps-panel ps-panel-fixed">
            <div className="ps-panel-header">
              <h3>Visual Settings</h3>
              <p>Choose media preferences, image style, and theme.</p>
            </div>

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
          onSelect={setTheme}
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