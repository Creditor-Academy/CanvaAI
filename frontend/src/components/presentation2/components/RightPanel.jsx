import React from 'react';
import { Sparkles, Wand2, Play } from 'lucide-react';

/**
 * RightPanel Component
 * 
 * Vertical minimal panel with exactly 3 blocks:
 * 1. Themes
 * 2. AI Tools (placeholder)
 * 3. Present button
 */
const RightPanel = ({
  onThemeSelect,
  onPresent,
}) => {
  // TODO: Replace with actual themes from theme system
  const themes = [
    { id: 'default', name: 'Default', colors: ['#ffffff', '#000000'] },
    { id: 'modern', name: 'Modern', colors: ['#f3f4f6', '#1f2937'] },
    { id: 'minimal', name: 'Minimal', colors: ['#ffffff', '#374151'] },
  ];

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col h-full p-4 space-y-4">
      {/* Block 1: Themes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Sparkles size={16} />
          <span>Themes</span>
        </div>
        <div className="space-y-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeSelect?.(theme.id)}
              className="w-full p-3 border border-gray-200 rounded hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  {theme.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">{theme.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Block 2: AI Tools */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Wand2 size={16} />
          <span>AI Tools</span>
        </div>
        <div className="p-4 border border-gray-200 rounded bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            AI tools coming soon
          </p>
          {/* TODO: Add AI tool buttons when ready */}
        </div>
      </div>

      {/* Block 3: Present Button */}
      <div className="mt-auto">
        <button
          onClick={onPresent}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Play size={18} />
          <span>Present</span>
        </button>
      </div>
    </div>
  );
};

export default RightPanel;