import React from 'react';

const OPTIONS = [
  { id: 'low', title: 'Low', description: 'Visual heavy' },
  { id: 'medium', title: 'Medium', description: 'Balanced' },
  { id: 'high', title: 'High', description: 'Text heavy' },
];

const TextAmountSelector = ({ value, onChange }) => (
  <div>
    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#717782]">
      Text Amount
    </p>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {OPTIONS.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              active
                ? 'border-[#005ea1] bg-[#d2e4ff]/40 shadow-sm'
                : 'border-[#c0c7d3] bg-white hover:border-[#005ea1]/40'
            }`}
          >
            <span className="block text-sm font-semibold text-[#121c2c]">
              {option.title}
            </span>
            <span className="mt-0.5 block text-xs text-[#414751]">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default TextAmountSelector;
