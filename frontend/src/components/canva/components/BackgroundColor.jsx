import React from 'react';

export const GRADIENTS = [
  {
    name: 'Midnight Rose',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    name: 'Oceanic',
    value: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)'
  },
  {
    name: 'Aurora',
    value: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)'
  },
  {
    name: 'Hyper Dusk',
    value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)'
  },
  {
    name: 'Emerald City',
    value: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  {
    name: 'Slate Night',
    value: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
  },
];

const BackgroundColor = ({ onColorChange }) => {
  return (
    <div className='grid grid-cols-3 gap-3 p-2'>
      {GRADIENTS.map((g) => (
        <button
          key={g.name}
          aria-label={`Select ${g.name} background`}
          className='group relative aspect-square rounded-lg overflow-hidden transition-all duration-300 hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 shadow-sm'
          style={{ background: g.value }}
          onClick={() => onColorChange?.(g.value)}
        >
          <div className='absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
            <span className='text-[10px] text-white font-medium uppercase tracking-wider'>
              {g.name}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default BackgroundColor;


