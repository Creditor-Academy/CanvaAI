import React from 'react';
import {
  FiEdit3,
  FiTrash2,
  FiX,
  FiAlignLeft,
  FiZap,
  FiRotateCw,
  FiMove
} from 'react-icons/fi';

const ImageEditingToolbar = ({
  selectedLayer,
  layer,
  onEdit,
  onEraser,
  onClear,
  onAlign,
  onDraw,
  onFlip,
  onAnimate,
  onPosition
}) => {
  if (!selectedLayer || !layer || layer.type !== 'image') {
    return null;
  }

  return (
    <div className="h-[60px] bg-white border-b border-gray-200 flex items-center px-5 gap-3 shadow-sm">
      <button
        type="button"
        onClick={onEdit}
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300"
        title="Edit"
      >
        <FiEdit3 size={16} />
        Edit
      </button>
      <button
        type="button"
        onClick={onEraser}
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300"
        title="Eraser"
      >
        <FiTrash2 size={16} />
        Eraser
      </button>
      <button
        type="button"
        onClick={onClear}
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300"
        title="Clear"
      >
        <FiX size={16} />
      </button>
      <button
        type="button"
        onClick={onAlign}
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300"
        title="Align"
      >
        <FiAlignLeft size={16} />
      </button>
      <button
        type="button"
        onClick={onDraw}
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300"
        title="Draw"
      >
        <FiZap size={16} />
      </button>
      <button
        type="button"
        onClick={onFlip}
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300"
        title="Flip"
      >
        <FiRotateCw size={16} />
        Flip
      </button>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onAnimate}
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300"
        title="Animate"
      >
        Animate
      </button>
      <button
        type="button"
        onClick={onPosition}
        className="px-3 py-2 border border-gray-200 rounded-md bg-white cursor-pointer flex items-center gap-2 text-sm text-gray-800 transition-all duration-200 font-medium hover:bg-gray-50 hover:border-gray-300"
        title="Position"
      >
        <FiMove size={16} />
        Position
      </button>
    </div>
  );
};

export default ImageEditingToolbar;
