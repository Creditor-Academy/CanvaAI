import React from 'react';
import { STATIC_PRESENTATION_THEMES } from './themeTemplates';
import PresentationThumbnail from '@/components/PresentationThumbnail';

const AllTheme = ({ selectedThemeId, onSelectTheme }) => {
    const getFirstSlide = (theme) => {
        return theme.presentation?.slides?.[0] || null;
    };

    return (
        <div className="grid gap-4">
            {STATIC_PRESENTATION_THEMES.map((theme) => {
                const slide = getFirstSlide(theme);
                return (
                    <button
                        key={theme.id}
                        type="button"
                        onClick={() => onSelectTheme(theme)}
                        className={`w-full text-left rounded-xl overflow-hidden border transition-shadow duration-200 ${selectedThemeId === theme.id
                            ? 'border-amber-400 shadow-2xl'
                            : 'border-slate-200 hover:border-amber-300 hover:shadow-lg'
                            }`}
                    >
                        <div className="h-40 bg-slate-100 overflow-hidden bg-contain">
                            {slide ? (
                                <PresentationThumbnail slide={slide} width="100%" height="100%" />
                            ) : (
                                <img
                                    src={theme.previewImage}
                                    alt={theme.name}
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default AllTheme;
