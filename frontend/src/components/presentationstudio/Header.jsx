import React, { useState } from 'react';
import { FiDownload, FiShare2, FiSave, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import { MdAutoAwesome } from 'react-icons/md';

const Header = ({
    handleSavePresentation,
    handleExport,
    handleSharePresentation,
    isExporting,
    onBack,
    title,
    subtitle
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className="presentation-studio-header">
            <div className="header-left">
                {onBack && (
                    <button
                        onClick={onBack}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            border: '1px solid rgba(15, 23, 42, 0.1)',
                            background: '#ffffff',
                            color: '#0f172a',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)';
                        }}
                        title="Back to layout selection"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                )}


            </div>
            <div className="header-center">
                <h1 className="presentation-studio-title">
                    {title || "AI Presentation Studio"}
                </h1>

                <p className="presentation-studio-subtitle">
                    {subtitle || "Create stunning presentations with AI in seconds"}
                </p>
            </div>
            {/* <div className="presentation-studio-header-actions">
        <button 
          onClick={handleSavePresentation}
          className="presentation-studio-button presentation-studio-button-primary"
        >
          <FiSave size={18} />
          <span>Save</span>
        </button>
        <div 
          className="presentation-studio-dropdown"
          onBlur={() => setIsDropdownOpen(false)}
          tabIndex="0"
        >
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`presentation-studio-button presentation-studio-button-secondary ${isExporting ? 'presentation-studio-button-disabled' : ''}`}
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
          >
            {isExporting ? (
              <FiRefreshCw className="presentation-studio-spinner" size={18} />
            ) : (
              <FiDownload size={18} />
            )}
            <span>Export</span>
          </button>
          {isDropdownOpen && (
            <div className="presentation-studio-dropdown-menu">
              <button 
                onClick={() => {
                  handleExport('pptx');
                  setIsDropdownOpen(false);
                }}
                className="presentation-studio-dropdown-item"
              >
                Export as PowerPoint
              </button>
              <button 
                onClick={() => {
                  handleExport('pdf');
                  setIsDropdownOpen(false);
                }}
                className="presentation-studio-dropdown-item"
              >
                Export as PDF
              </button>
              <button 
                onClick={() => {
                  handleExport('png');
                  setIsDropdownOpen(false);
                }}
                className="presentation-studio-dropdown-item"
              >
                Export as Images
              </button>
            </div>
          )}
        </div>
        <button 
          onClick={handleSharePresentation}
          className="presentation-studio-button presentation-studio-button-secondary"
        >
          <FiShare2 size={18} />
          <span>Share</span>
        </button>
      </div> */}
        </div>
    );
};

export default Header;