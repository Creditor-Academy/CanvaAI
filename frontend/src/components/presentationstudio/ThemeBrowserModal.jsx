import React, { useState, useMemo } from 'react';
import ThemeCard from './ThemeCard';
import { PRESENTATION_THEMES } from '../../constants/presentationThemes';

const ThemeBrowserModal = ({ isOpen, onClose, initialTheme, onSelect }) => {
    const [selectedInModal, setSelectedInModal] = useState(initialTheme || PRESENTATION_THEMES[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Dark', 'Light', 'Professional', 'Colorful'];

    const filteredThemes = useMemo(() => {
        return PRESENTATION_THEMES.filter(theme => {
            const matchesSearch = theme.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'All' || theme.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeCategory]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1100px',
                height: '85vh',
                backgroundColor: 'white',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                {/* Header and Content Area */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Left Sidebar: Theme Selector */}
                    <div style={{
                        width: '380px',
                        borderRight: '1px solid #e5e7eb',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#f9fafb'
                    }}>
                        <div style={{ padding: '24px 20px 16px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>All themes</h2>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>View and select from all themes</p>

                            <div style={{ marginTop: '20px', position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search for a theme"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            border: '1px solid',
                                            borderColor: activeCategory === cat ? '#6366f1' : '#e5e7eb',
                                            backgroundColor: activeCategory === cat ? '#eef2ff' : 'white',
                                            color: activeCategory === cat ? '#6366f1' : '#4b5563',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '0 20px 24px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '12px'
                        }}>
                            {filteredThemes.map(theme => (
                                <div key={theme.id} style={{ transform: 'scale(0.95)', transformOrigin: 'top' }}>
                                    <ThemeCard
                                        theme={theme}
                                        isSelected={selectedInModal.id === theme.id}
                                        onClick={() => setSelectedInModal(theme)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Area: Detailed Preview */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#f3f4f6',
                        position: 'relative',
                        padding: '40px'
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                zIndex: 10
                            }}
                        >
                            ✕
                        </button>

                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}>
                            {/* Slide Canvas */}
                            <div style={{
                                width: '100%',
                                aspectRatio: '16/9',
                                backgroundColor: selectedInModal.slideBackground,
                                borderRadius: '12px',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                                padding: '5% 7%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                overflow: 'hidden',
                                fontFamily: "'Inter', sans-serif"
                            }}>
                                {/* Decorative Accent Element */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '6px',
                                    height: '100%',
                                    backgroundColor: selectedInModal.accentColor
                                }} />

                                {/* Slide Title */}
                                <div style={{
                                    color: selectedInModal.titleColor,
                                    fontSize: 'clamp(20px, 3.5vw, 36px)',
                                    fontWeight: '800',
                                    lineHeight: 1.1,
                                    marginBottom: '3%',
                                    maxWidth: '90%'
                                }}>
                                    Your Presentation Title Goes Here
                                </div>

                                {/* Slide Content Area */}
                                <div style={{
                                    display: 'flex',
                                    gap: '4%',
                                    flex: 1,
                                    minHeight: 0,
                                    alignItems: 'center'
                                }}>
                                    {/* Image Placeholder */}
                                    <div style={{
                                        flex: 1,
                                        height: '100%',
                                        backgroundColor: 'rgba(0,0,0,0.02)',
                                        border: `1px dashed ${selectedInModal.accentColor}30`,
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '10px'
                                    }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            backgroundColor: `${selectedInModal.accentColor}10`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={selectedInModal.accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                        </div>
                                        <span style={{
                                            color: '#9ca3af',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            textAlign: 'center'
                                        }}>
                                            Image Placeholder
                                        </span>
                                    </div>

                                    {/* Text Content */}
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        paddingRight: '2%'
                                    }}>
                                        <div style={{
                                            color: selectedInModal.bodyColor,
                                            fontSize: 'clamp(13px, 1.4vw, 16px)',
                                            lineHeight: 1.5,
                                            marginBottom: '10px',
                                            opacity: 0.9
                                        }}>
                                            This is a preview of your selected theme. It showcases the typography, color palette, and visual hierarchy that will be applied to your entire presentation.
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <div style={{
                                                width: '24px',
                                                height: '3px',
                                                backgroundColor: selectedInModal.accentColor,
                                                borderRadius: '2px'
                                            }} />
                                            <span style={{
                                                color: selectedInModal.accentColor,
                                                fontWeight: '700',
                                                fontSize: '12px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>
                                                Theme: {selectedInModal.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            backgroundColor: 'white',
                            color: '#374151',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onSelect(selectedInModal);
                            onClose();
                        }}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#0047AB',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Select theme
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThemeBrowserModal;
