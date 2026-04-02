/**
 * ToolbarButton
 * Shared atomic button used throughout EditorToolbar.
 * Extracted from TextEditor.jsx to keep the toolbar file focused on layout.
 */

import React from 'react';
import { Button } from '../ui/button';
import { cn } from '../utils';
import { guardToolbarMouseDown } from './focusUtils';

/**
 * @param {object}  props
 * @param {object}  props.editor       - Tiptap editor instance (for focus guard)
 * @param {func}    props.onClick       - Click handler
 * @param {bool}    [props.isActive]    - Whether the format is currently active
 * @param {bool}    [props.disabled]
 * @param {string}  [props.tooltip]     - Used as aria-label fallback
 * @param {string}  [props.ariaLabel]
 * @param {string}  [props.className]
 * @param {node}    props.children
 */
const ToolbarButton = ({
  editor,
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  children,
  className,
  ariaLabel,
}) => {
  // Strip gradient utility classes that should not appear on icon buttons
  let cleanClass = className || '';
  if (
    cleanClass.includes('from-blue-') ||
    cleanClass.includes('from-green-') ||
    cleanClass.includes('from-gray-')
  ) {
    cleanClass = '';
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onMouseDown={(e) => guardToolbarMouseDown(e, editor)}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || tooltip}
      className={cn(
        'h-8 w-8 p-0 rounded-full flex items-center justify-center transition-all duration-200 border',
        isActive
          ? 'bg-green-100 border-green-300 text-green-600 shadow-inner'
          : 'bg-transparent border-transparent text-blue-500 hover:bg-blue-100/50 hover:border-blue-200',
        disabled && 'opacity-50 cursor-not-allowed',
        cleanClass
      )}
    >
      {children}
    </Button>
  );
};

export default ToolbarButton;
