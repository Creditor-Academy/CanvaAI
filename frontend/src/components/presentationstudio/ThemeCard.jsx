import React from 'react';
import { Check } from 'lucide-react';

const ThemeCard = ({ theme, isSelected, onClick, compact = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative w-full overflow-hidden rounded-xl border text-left transition hover:shadow-md ${
      isSelected
        ? 'border-[#005ea1] ring-2 ring-[#005ea1]/15'
        : 'border-[#c0c7d3] hover:border-[#005ea1]/40'
    }`}
    style={{
      background: theme.slideBackground,
    }}
  >
    {isSelected && (
      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#005ea1] text-white">
        <Check size={12} strokeWidth={3} />
      </span>
    )}

    <div
      className={`p-3 ${compact ? 'min-h-[88px]' : 'min-h-[100px]'}`}
      style={{ color: theme.titleColor }}
    >
      <div
        className="mb-2 h-1.5 w-8 rounded-full"
        style={{ background: theme.accentColor }}
      />
      <div
        className="mb-1 text-xs font-bold leading-tight"
        style={{ color: theme.titleColor }}
      >
        Title Example
      </div>
      <div
        className="text-[10px] leading-snug opacity-80"
        style={{ color: theme.bodyColor }}
      >
        Clean presentation preview...
      </div>
    </div>

    <div
      className="border-t px-3 py-2 text-xs font-semibold"
      style={{
        borderColor: `${theme.bodyColor}22`,
        color: theme.titleColor,
      }}
    >
      {theme.name}
    </div>
  </button>
);

export default ThemeCard;
