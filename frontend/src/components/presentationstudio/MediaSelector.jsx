import React from 'react';

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
  <div className="ps-field-block">
    <label className="ps-field-label">Media</label>
    <p className="ps-field-help">Media is enabled by default. Choose a style.</p>
    <div className="ps-media-style-grid">
      {MEDIA_STYLES.map((style) => (
        <button
          key={style.value}
          type="button"
          className={`ps-media-style-card ${value === style.value ? 'active' : ''}`}
          onClick={() => onChange(style.value)}
          aria-pressed={value === style.value}
        >
          <div className="ps-media-style-thumb-wrapper">
            <img
              src={style.img}
              alt={style.label}
              className="ps-media-style-thumb"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
          <span className="ps-media-style-label">{style.label}</span>
        </button>
      ))}
    </div>
  </div>
);

export default MediaSelector;
