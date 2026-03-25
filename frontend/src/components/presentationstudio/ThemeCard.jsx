import React from 'react';

const ThemeCard = ({ theme, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`theme-card ${isSelected ? 'selected' : ''}`}
      style={{
        '--theme-bg': theme.slideBackground,
        '--theme-title': theme.titleColor,
        '--theme-body': theme.bodyColor,
        '--theme-accent': theme.accentColor,
      }}
    >
      <div className="theme-card-accent" />
      <div className="theme-card-top">
        <div className="theme-card-title">Title Example</div>
        {isSelected && <div className="theme-card-badge">Selected</div>}
      </div>

      <div className="theme-card-body">
        Clean presentation preview text...
      </div>

      <div className="theme-card-footer">
        <div className="theme-card-line" />
        <span>{theme.name}</span>
      </div>
    </div>
  );
};

export default ThemeCard;