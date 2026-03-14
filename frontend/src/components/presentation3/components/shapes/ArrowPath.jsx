import React from "react";

const ArrowPath = ({ strokeColor = "#000", strokeWidth = 2 }) => {
  return (
    <path
      d="M0 50 L90 50 L80 40 M90 50 L80 60"
      fill="none"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

export default ArrowPath;