import React from 'react';

const ImageIcon = ({ size = 16, className = '', ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className={className}
        {...props}
    >
        <rect x="3" y="3" width="18" height="18" rx="3"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <path d="M21 15l-5-5-4 4-3-3-6 6"></path>
    </svg>
);

export default ImageIcon;
