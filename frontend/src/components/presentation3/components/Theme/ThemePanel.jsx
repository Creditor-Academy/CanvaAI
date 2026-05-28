import React, { useState } from 'react';
import usePresentationStore from '../../store/usePresentationStore';
import AllTheme from './AllTheme';

const ThemePanel = ({ onClose = () => { } }) => {
    const [selectedThemeId, setSelectedThemeId] = useState(null);
    const setPresentation = usePresentationStore((state) => state.setPresentation);

    const handleSelectTheme = (theme) => {
        setSelectedThemeId(theme.id);
        setPresentation({
            ...theme.presentation,
            presentationId: null,
        });
        onClose();
    };

    return (
        <div
            className="fixed right-1 h-screen p-5 bg-white/95 border border-amber-300/60 rounded-3xl shadow-2xl backdrop-blur-lg z-30 overflow-auto flex flex-col gap-4"
            style={{ top: 60, width: 'min(360px,calc(100vw-40px))' }}
        >
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-bold text-slate-900 m-0">Templates</h1>
                    <p className="text-sm text-slate-500">Select a static theme to open it directly in the presentation canvas.</p>
                </div>
                <button
                    className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-500"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>

            <AllTheme selectedThemeId={selectedThemeId} onSelectTheme={handleSelectTheme} />
        </div>
    );
};

export default ThemePanel;



