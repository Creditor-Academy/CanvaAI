import React from 'react';

const ShadowsControl = ({ value, onChange }) => {
  const shadowValue = value || {
    enabled: true,
    x: 0,
    y: 0,
    blur: 0,
    spread: 0,
    color: '#000000',
    opacity: 50
  };

  const handleChange = (property, val) => {
    const newValue = { ...shadowValue, [property]: val };
    onChange(newValue);
  };

  return (
    <div className="mb-3">
      <h4 className="mt-4 mb-2 text-base">Shadow</h4>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] text-gray-700 font-medium min-w-[80px]">
          X Offset
        </span>
        <input
          type="range"
          min="-50"
          max="50"
          value={shadowValue.x}
          onChange={(e) => handleChange('x', parseInt(e.target.value))}
          className="w-[100px]"
        />
        <span className="text-xs text-gray-500 min-w-[35px]">
          {shadowValue.x}px
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] text-gray-700 font-medium min-w-[80px]">
          Y Offset
        </span>
        <input
          type="range"
          min="-50"
          max="50"
          value={shadowValue.y}
          onChange={(e) => handleChange('y', parseInt(e.target.value))}
          className="w-[100px]"
        />
        <span className="text-xs text-gray-500 min-w-[35px]">
          {shadowValue.y}px
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] text-gray-700 font-medium min-w-[80px]">
          Blur
        </span>
        <input
          type="range"
          min="0"
          max="50"
          value={shadowValue.blur}
          onChange={(e) => handleChange('blur', parseInt(e.target.value))}
          className="w-[100px]"
        />
        <span className="text-xs text-gray-500 min-w-[35px]">
          {shadowValue.blur}px
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] text-gray-700 font-medium min-w-[80px]">
          Spread
        </span>
        <input
          type="range"
          min="-20"
          max="20"
          value={shadowValue.spread}
          onChange={(e) => handleChange('spread', parseInt(e.target.value))}
          className="w-[100px]"
        />
        <span className="text-xs text-gray-500 min-w-[35px]">
          {shadowValue.spread}px
        </span>
      </div>


      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] text-gray-700 font-medium min-w-[80px]">
          Opacity
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={shadowValue.opacity}
          onChange={(e) => handleChange('opacity', parseInt(e.target.value))}
          className="w-[100px]"
        />
        <span className="text-xs text-gray-500 min-w-[35px]">
          {shadowValue.opacity}%
        </span>
      </div>


      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] text-gray-700 font-medium min-w-[80px]">
          Shadow
        </span>
        <input
          type="color"
          value={shadowValue.color}
          onChange={(e) => handleChange('color', e.target.value)}
          className="w-10 h-7 border border-gray-300 rounded cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ShadowsControl;
