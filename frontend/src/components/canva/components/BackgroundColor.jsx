import React from 'react'

const BackgroundColor = ({ onColorChange }) => {
  const colors = [
    { name: 'red', value: '#ef4444' },
    { name: 'blue', value: '#3b82f6' },
    { name: 'green', value: '#22c55e' },
    { name: 'yellow', value: '#eab308' },
    { name: 'purple', value: '#a855f7' },
    { name: 'orange', value: '#f97316' },
    { name: 'white', value: '#ffffff' },
    { name: 'black', value: '#000000' },
  ];

  const handleColorClick = (colorValue) => {
    if (onColorChange) {
      onColorChange(colorValue);
    }
  };

  return (
    <div className='grid grid-cols-2 gap-2'>
      {colors.map((color) => (
        <div
          key={color.name}
          className='w-full h-20 rounded-sm cursor-pointer hover:scale-105 transition-all duration-300 border-2 border-gray-600 hover:border-gray-400'
          style={{ backgroundColor: color.value }}
          onClick={() => handleColorClick(color.value)}
          title={color.name.charAt(0).toUpperCase() + color.name.slice(1)}
        />
      ))}
    </div>
  )
}

export default BackgroundColor;


