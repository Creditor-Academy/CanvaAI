import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

const Header = ({ onBack, title, subtitle }) => {
  return (
    <div className="presentation-studio-header">
      <div className="header-shell">
        <div className="header-left">
          {onBack && (
            <button
              onClick={onBack}
              className="header-back-button"
              title="Back to previous step"
            >
              <FiArrowLeft size={18} />
            </button>
          )}
        </div>

        <div className="header-center">
         
          <h1 className="presentation-studio-title">
            {title || 'AI Presentation Studio'}
          </h1>
          <p className="presentation-studio-subtitle">
            {subtitle || 'Create stunning presentations with AI in seconds'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Header;