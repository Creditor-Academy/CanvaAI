import React, { useState, memo } from 'react';
import { SketchPicker } from 'react-color';
import { Pipette } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';

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
  {
    name: 'Sunset Blaze',
    value: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)'
  },
  {
    name: 'Purple Haze',
    value: 'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)'
  },
  {
    name: 'Arctic Dawn',
    value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  },
  {
    name: 'Crimson Tide',
    value: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)'
  },
  {
    name: 'Mystic Forest',
    value: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)'
  },
  {
    name: 'Neon Nights',
    value: 'linear-gradient(135deg, #FF0080 0%, #FF8C00 100%)'
  },
  {
    name: 'Royal Velvet',
    value: 'linear-gradient(135deg, #7F00FF 0%, #E100FF 100%)'
  },
  {
    name: 'Golden Hour',
    value: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)'
  },
  {
    name: 'Deep Space',
    value: 'linear-gradient(135deg, #000428 0%, #004e92 100%)'
  },
  {
    name: 'Berry Smoothie',
    value: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)'
  },
  {
    name: 'Coral Reef',
    value: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)'
  },
  {
    name: 'Mint Fresh',
    value: 'linear-gradient(135deg, #00F260 0%, #0575E6 100%)'
  },
  {
    name: 'Desert Dunes',
    value: 'linear-gradient(135deg, #EDDE5D 0%, #F09819 100%)'
  },
  {
    name: 'Twilight Sky',
    value: 'linear-gradient(135deg, #1D2B64 0%, #F8CDDA 100%)'
  },
  {
    name: 'Electric Blue',
    value: 'linear-gradient(135deg, #00B4DB 0%, #0083B0 100%)'
  },
  {
    name: 'Violet Dreams',
    value: 'linear-gradient(135deg, #DA22FF 0%, #9733EE 100%)'
  },
  {
    name: 'Fiery Orange',
    value: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)'
  },
  {
    name: 'Emerald Waves',
    value: 'linear-gradient(135deg, #02AAB0 0%, #00CDAC 100%)'
  },
  {
    name: 'Plum Passion',
    value: 'linear-gradient(135deg, #6A11CB 0%, #2575FC 100%)'
  }
];

const BackgroundColor = memo(({ onColorChange }) => {
  const [color, setColor] = useState('#ffffff');
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = (newColor) => {
    setColor(newColor.hex);
    onColorChange?.(newColor.hex);
  };

  return (
    <div className='p-2'>
      <div className='mb-6'>
        <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
          <Popover.Trigger asChild>
            <button
              className='w-full flex items-center justify-between p-3 rounded-xl border border-slate-700/50 hover:border-blue-500/50 bg-slate-800/50 hover:bg-slate-800 transition-all duration-300 group expanded-section-portal'
            >
              <div className='flex items-center gap-3'>
                <div
                  className='w-8 h-8 rounded shadow-inner border border-slate-700'
                  style={{ backgroundColor: color }}
                />
                <div className='text-left'>
                  <span className='block text-sm font-medium text-slate-200'>Custom Color</span>
                  <span className='block text-[10px] text-slate-500 font-mono uppercase tracking-tight'>{color}</span>
                </div>
              </div>
              <Pipette className='w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors' />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className='z-[10001] bg-slate-900 rounded-xl shadow-2xl border border-slate-700 p-3 animate-in fade-in zoom-in-95 duration-200 expanded-section-portal'
              sideOffset={12}
              align="start"
              onInteractOutside={(e) => {
                if (e.target.closest('.expanded-section-portal')) {
                  e.preventDefault();
                }
              }}
              onPointerDownOutside={(e) => {
                if (e.target.closest('.expanded-section-portal')) {
                  e.preventDefault();
                }
              }}
            >
              <SketchPicker
                color={color}
                onChange={handleColorChange}
                disableAlpha={true}
                width='220px'
                styles={{
                  default: {
                    picker: {
                      background: 'transparent',
                      border: 'none',
                      boxShadow: 'none',
                    },
                    controls: {
                      padding: '10px 0 0 0',
                    }
                  }
                }}
              />
              <Popover.Arrow className="fill-slate-900 stroke-slate-700" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <div className='text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-4 px-1'>
        Presets & Gradients
      </div>

      <div className='grid grid-cols-3 gap-3 pb-18'>
        {GRADIENTS.map((g) => (
          <button
            key={g.name}
            aria-label={`Select ${g.name} background`}
            className='group relative aspect-square rounded-xl overflow-hidden transition-all duration-300'
            style={{ background: g.value }}
            onClick={() => onColorChange?.(g.value)}
          >
            <div className='absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]'>
              <span className='text-[9px] text-white font-bold uppercase tracking-widest text-center px-1 leading-tight'>
                {g.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

export default BackgroundColor;
