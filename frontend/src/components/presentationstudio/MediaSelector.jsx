import React from 'react';
import { Globe } from 'lucide-react';

const MEDIA_STYLES = [
  {
    value: 'realistic',
    label: 'Realistic',
    img: 'https://i.pinimg.com/736x/5c/b9/62/5cb9627a8d35ff42a96510c58fd68cd2.jpg',
  },
  {
    value: 'anime',
    label: 'Anime',
    img: 'https://i.pinimg.com/736x/92/bf/03/92bf03bfcd83247fab3b468fe560cfc7.jpg',
  },
  {
    value: 'cartoon',
    label: 'Cartoon',
    img: 'https://i.pinimg.com/736x/69/a2/7e/69a27e12ec3e857c925abb47590dd928.jpg',
  },
  {
    value: 'sketch',
    label: 'Sketch',
    img: 'https://i.pinimg.com/736x/98/18/3a/98183a4a3b3e8ea0dec2ff3fb3c33317.jpg',
  },
  {
    value: 'painting',
    label: 'Painting',
    img: 'https://i.pinimg.com/736x/ee/3d/9b/ee3d9bbd7bcba1287c2ba4f995423e8c.jpg',
  },
];

const MediaSelector = ({ value, onChange }) => (
  <div>
    <div className="mb-4 flex items-center gap-2">
      <Globe size={18} className="text-[#005ea1]" />
      <div>
        <h3 className="text-base font-semibold text-[#121c2c]">Media Style</h3>
        <p className="text-sm text-[#414751]">
          Choose a visual style for assets.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {MEDIA_STYLES.map((style) => {
        const active = value === style.value;
        return (
          <button
            key={style.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(style.value)}
            className={`overflow-hidden rounded-xl border text-left transition ${
              active
                ? 'border-[#005ea1] ring-2 ring-[#005ea1]/20'
                : 'border-[#c0c7d3] hover:border-[#005ea1]/40'
            }`}
          >
            <div className="aspect-[4/3] overflow-hidden bg-[#e7eeff]">
              <img
                src={style.img}
                alt={style.label}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
            <span className="block px-2 py-2 text-center text-xs font-semibold text-[#121c2c]">
              {style.label}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default MediaSelector;
