import React from 'react';
import { motion } from 'framer-motion';

export const GuardedOverlay = ({
  onClose,
  className = 'fixed inset-0 bg-black/20 z-50',
  initialOpacity = 0,
  animateOpacity = 1,
  exitOpacity = 0
}) => {
  const prevent = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  };

  return (
    <motion.div
      onMouseDown={prevent}
      onPointerDown={prevent}
      initial={{ opacity: initialOpacity }}
      animate={{ opacity: animateOpacity }}
      exit={{ opacity: exitOpacity }}
      onClick={onClose}
      className={className}
    />
  );
};

export default GuardedOverlay;
