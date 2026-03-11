import React from 'react';

const ThemeCard = ({ theme, isSelected, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                background: theme.slideBackground,
                border: isSelected ? `2px solid ${theme.accentColor}` : '1px solid #e5e7eb',
                boxShadow: isSelected ? `0 0 0 4px ${theme.accentColor}25` : '0 1px 3px rgba(0,0,0,0.05)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                height: '110px',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                }
            }}
            onMouseLeave={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }
            }}
        >
            <div style={{ color: theme.titleColor, fontWeight: '700', fontSize: '15px', fontFamily: "'Inter', sans-serif" }}>
                Title Example
            </div>
            <div style={{ color: theme.bodyColor, fontSize: '13px', flex: 1, fontFamily: "'Inter', sans-serif", opacity: 0.9 }}>
                Body text example...
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
                <div style={{ width: '20px', height: '6px', borderRadius: '4px', background: theme.accentColor }}></div>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', fontFamily: "'Inter', sans-serif" }}>
                    {theme.name}
                </span>
            </div>
        </div>
    );
};

export default ThemeCard;
