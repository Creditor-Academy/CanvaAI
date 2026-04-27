import React, { useState, useMemo, useEffect } from 'react';
import ThemeCard from './ThemeCard';
import { PRESENTATION_THEMES } from '../../constants/presentationThemes';

const ThemeBrowserModal = ({ isOpen, onClose, initialTheme, onSelect }) => {
  const [selectedInModal, setSelectedInModal] = useState(initialTheme || PRESENTATION_THEMES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    if (initialTheme) {
      setSelectedInModal(initialTheme);
    }
  }, [initialTheme, isOpen]);

  const categories = ['All', 'Dark', 'Light', 'Professional', 'Colorful'];

  const filteredThemes = useMemo(() => {
    return PRESENTATION_THEMES.filter((theme) => {
      const matchesSearch = theme.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || theme.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  if (!isOpen) return null;

  return (
    <div className="theme-modal-overlay">
      <div className="theme-modal-shell">
        <div className="theme-modal-main">
          
          <div className="theme-modal-sidebar">
            <div className="theme-modal-sidebar-top">
              <h2>Browse themes</h2>
              <p>Choose the visual style for your presentation.</p>

              <input
                type="text"
                placeholder="Search for a theme"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="theme-modal-search"
              />

              <div className="theme-modal-categories">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`theme-modal-category ${activeCategory === cat ? 'active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="theme-modal-grid">
              {filteredThemes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isSelected={selectedInModal?.id === theme.id}
                  onClick={() => setSelectedInModal(theme)}
                />
              ))}
            </div>
          </div>

          <div className="theme-modal-preview">
            <button onClick={onClose} className="theme-modal-close">✕</button>

            {selectedInModal && (
              <div className="theme-preview-frame">
                <div
                  className="theme-preview-canvas"
                  style={{ background: selectedInModal.slideBackground }}
                >
                  <div
                    className="theme-preview-accent"
                    style={{ background: selectedInModal.accentColor }}
                  />

                  <div
                    className="theme-preview-title"
                    style={{ color: selectedInModal.titleColor }}
                  >
                    Your Presentation Title Goes Here
                  </div>

                  <div className="theme-preview-content">
                    <div
                      className="theme-preview-image"
                      style={{
                        border: `1px dashed ${selectedInModal.accentColor}55`,
                      }}
                    >
                      <div
                        className="theme-preview-image-icon"
                        style={{ background: `${selectedInModal.accentColor}18` }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={selectedInModal.accentColor}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <span>Image Placeholder</span>
                    </div>

                    <div className="theme-preview-text-side">
                      <p
                        className="theme-preview-description"
                        style={{ color: selectedInModal.bodyColor }}
                      >
                        This is a preview of your selected theme. It shows the typography,
                        color palette, and visual hierarchy that will be applied across your slides.
                      </p>

                      <div className="theme-preview-tag">
                        <div
                          className="theme-preview-tag-line"
                          style={{ background: selectedInModal.accentColor }}
                        />
                        <span style={{ color: selectedInModal.accentColor }}>
                          Theme: {selectedInModal.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="theme-preview-meta">
                    <div className="theme-preview-meta-pill">
                      Accent
                      <span
                        className="theme-preview-color"
                        style={{ background: selectedInModal.accentColor }}
                      />
                    </div>
                    <div className="theme-preview-meta-pill">
                      {selectedInModal.category || 'Theme'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="theme-modal-footer">
              <button onClick={onClose} className="theme-modal-btn secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  onSelect(selectedInModal);
                  onClose();
                }}
                className="theme-modal-btn primary"
              >
                Select theme
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeBrowserModal;