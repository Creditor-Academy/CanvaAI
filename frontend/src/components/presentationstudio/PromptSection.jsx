import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import { useDashboardNavbar } from '../../contexts/DashboardNavbarContext';
import ThemeCard from './ThemeCard';
import { PRESENTATION_THEMES } from '../../constants/presentationThemes';
import usePresentationFormStore from './usePresentationFormStore';
import TextAmountSelector from './TextAmountSelector';
import MediaSelector from './MediaSelector';

const VISIBLE_THEME_COUNT = 3;

const FieldLabel = ({ children, required }) => (
  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#717782]">
    {children}
    {required && <span className="text-[#ba1a1a]"> *</span>}
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
    <div className="relative" ref={wrapperRef}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-[#c0c7d3] bg-white px-4 py-3 text-left text-sm font-medium text-[#121c2c] transition hover:border-[#005ea1]/40 focus:outline-none focus:ring-2 focus:ring-[#005ea1]/20"
      >
        <span className={value ? 'text-[#121c2c]' : 'text-[#717782]'}>
          {value || placeholder}
        </span>
        <FiChevronDown
          size={16}
          className={`text-[#717782] transition ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-52 overflow-y-auto rounded-xl border border-[#c0c7d3] bg-white p-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-[#f0f3ff] ${
                value === option.label
                  ? 'bg-[#d2e4ff]/50 font-semibold text-[#005ea1]'
                  : 'text-[#121c2c]'
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
  );
};

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
  onBack,
}) => {
  const {
    textAmount,
    media,
    selectedTheme,
    setTextAmount,
    setMediaStyle,
    setTheme,
  } = usePresentationFormStore();

  const [showAllThemes, setShowAllThemes] = useState(false);

  const navbarConfig = useMemo(
    () => ({
      subtitle: 'AI Presentation Studio',
      back: onBack ? { onClick: onBack } : null,
    }),
    [onBack]
  );

  useDashboardNavbar(navbarConfig);

  useEffect(() => {
    if (!selectedTheme) {
      const defaultTheme =
        PRESENTATION_THEMES.find((t) => t.id === 'slate-clean') ||
        PRESENTATION_THEMES[0];
      setTheme(defaultTheme);
    }
  }, [selectedTheme, setTheme]);

  const visibleThemes = showAllThemes
    ? PRESENTATION_THEMES
    : PRESENTATION_THEMES.slice(0, VISIBLE_THEME_COUNT);

  const canGenerate =
    prompt.trim() && tone && length && media?.style && selectedTheme;

  const handleGenerateClick = () => {
    const topic = prompt.trim();
    if (!topic || !tone || !length || !media?.style || !selectedTheme) return;

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

  const tones = ['Professional', 'Friendly', 'Creative', 'Corporate'];
  const slides = [2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="relative min-h-full font-['Plus_Jakarta_Sans',sans-serif] text-[#121c2c]">
      <div className="mx-auto w-full max-w-[720px] pb-12 pt-2">
        <div className="mt-2 space-y-5">
          {/* Title & outline card */}
          <section className="rounded-2xl border border-[#c0c7d3] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] sm:p-6">
            <div className="mb-5">
              <FieldLabel required>Title</FieldLabel>
              <div className="mb-1 flex justify-end">
                <span
                  className={`text-xs ${
                    prompt.length >= 100 ? 'text-[#ba1a1a]' : 'text-[#717782]'
                  }`}
                >
                  {prompt.length >= 100
                    ? 'Limit reached'
                    : `${prompt.length}/100`}
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 100))}
                placeholder="Write your presentation title..."
                maxLength={100}
                rows={2}
                className="w-full resize-none rounded-xl border border-[#c0c7d3] bg-[#f9f9ff] px-4 py-3 text-sm text-[#121c2c] outline-none transition focus:border-[#005ea1] focus:ring-2 focus:ring-[#005ea1]/15"
              />
            </div>

            <div className="mb-5">
              <FieldLabel>Outline</FieldLabel>
              <div className="mb-1 flex justify-end">
                <span
                  className={`text-xs ${
                    (outlineText?.length || 0) >= 1000
                      ? 'text-[#ba1a1a]'
                      : 'text-[#717782]'
                  }`}
                >
                  {outlineText?.length || 0}/1000
                </span>
              </div>
              <textarea
                value={outlineText || ''}
                onChange={(e) =>
                  setOutlineText(e.target.value.slice(0, 1000))
                }
                placeholder="Write bullet points or structured outline..."
                maxLength={1000}
                rows={3}
                className="w-full resize-none rounded-xl border border-[#c0c7d3] bg-[#f9f9ff] px-4 py-3 text-sm text-[#121c2c] outline-none transition focus:border-[#005ea1] focus:ring-2 focus:ring-[#005ea1]/15"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CustomSelect
                label="Tone"
                required
                value={tone}
                onChange={setTone}
                placeholder="Professional"
                options={tones.map((item) => ({ label: item, value: item }))}
              />
              <CustomSelect
                label="Slides"
                required
                value={length ? `${length} Slides` : ''}
                onChange={(selectedLabel) => {
                  setLength(selectedLabel.split(' ')[0]);
                }}
                placeholder="5 Slides"
                options={slides.map((num) => ({
                  label: `${num} Slides`,
                  value: String(num),
                }))}
              />
            </div>
          </section>

          {/* Text amount */}
          <section className="rounded-2xl border border-[#c0c7d3] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] sm:p-6">
            <TextAmountSelector value={textAmount} onChange={setTextAmount} />
          </section>

          {/* Media style */}
          <section className="rounded-2xl border border-[#c0c7d3] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] sm:p-6">
            <MediaSelector value={media.style} onChange={setMediaStyle} />
          </section>

          {/* Visual settings / themes */}
          <section className="rounded-2xl border border-[#c0c7d3] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles size={18} className="text-[#005ea1]" />
              <div>
                <h3 className="text-base font-semibold text-[#121c2c]">
                  Visual Settings
                </h3>
              </div>
            </div>

            <FieldLabel required>Theme</FieldLabel>
            <div
              className={`grid gap-3 ${
                showAllThemes
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-3'
              }`}
            >
              {visibleThemes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isSelected={selectedTheme?.id === theme.id}
                  compact
                  onClick={() => setTheme(theme)}
                />
              ))}
            </div>

            {PRESENTATION_THEMES.length > VISIBLE_THEME_COUNT && (
              <button
                type="button"
                onClick={() => setShowAllThemes((v) => !v)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#c0c7d3] bg-white py-3 text-sm font-medium text-[#121c2c] transition hover:border-[#005ea1]/40 hover:bg-[#f0f3ff]"
              >
                {showAllThemes ? 'Show Fewer Themes' : 'Show All Themes'}
                {showAllThemes ? (
                  <FiChevronUp size={16} />
                ) : (
                  <FiChevronDown size={16} />
                )}
              </button>
            )}
          </section>

          {/* Generate */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerateClick}
              disabled={isGenerating || !canGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#005ea1] px-6 py-4 text-base font-semibold text-white shadow-lg shadow-[#005ea1]/25 transition hover:bg-[#00497e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={20} />
              <span>Generate Outline</span>
              {isGenerating && (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptSection;
