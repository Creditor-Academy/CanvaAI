import React from 'react';
import { STATIC_PRESENTATION_THEMES } from './themeTemplates';

const AllTheme = ({ selectedThemeId, onSelectTheme }) => {
    return (
        <div className="grid gap-4">
            {STATIC_PRESENTATION_THEMES.map((theme) => (
                <button
                    key={theme.id}
                    type="button"
                    onClick={() => onSelectTheme(theme)}
                    className={`w-full text-left rounded-3xl overflow-hidden border transition-shadow duration-200 ${selectedThemeId === theme.id
                            ? 'border-amber-400 shadow-2xl'
                            : 'border-slate-200 hover:border-amber-300 hover:shadow-lg'
                        }`}
                >
                    <div className="h-40 bg-slate-100 overflow-hidden">
                        <img
                            src={theme.previewImage}
                            alt={theme.name}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="p-4 bg-white">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div>
                                <h2 className="text-base font-semibold text-slate-900">{theme.name}</h2>
                                <p className="text-sm text-slate-500">{theme.description}</p>
                            </div>
                            {selectedThemeId === theme.id && (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">
                                    Selected
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-slate-600">Click to open template</div>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default AllTheme;
