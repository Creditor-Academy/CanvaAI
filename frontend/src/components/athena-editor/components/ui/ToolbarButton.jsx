import React from 'react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '../ui/tooltip';
import { cn } from '../utils';
import { scrollLockManager } from '../../utils/scrollLockManager';

export const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  children,
  className
}) => {
  // CRITICAL ROBUST FIX: Prevent focus stealing and page scrolling when clicking toolbar buttons
  const handleMouseDown = (e) => {
    if (!disabled) {
      e.preventDefault();
      e.stopPropagation();
      
      // CRITICAL #1: Signal to editor that toolbar is being interacted with
      window.isToolbarInteraction = true;
      window.wasToolbarInteractionRecent = true;
      
      // CRITICAL #2: Lock scroll position using manager
      const editorContainer = document.querySelector('.editor-scroll-container, .content-container');
      if (editorContainer) {
        scrollLockManager.lock(editorContainer);
      }
      
      // CRITICAL #3: Keep signal active for sufficient time
      setTimeout(() => {
        window.isToolbarInteraction = false;
        scrollLockManager.unlock();
      }, 500); // Extended to 500ms for safety
      
      // CRITICAL #4: Clear recent flag after longer delay
      setTimeout(() => {
        window.wasToolbarInteractionRecent = false;
      }, 1000);
    }
  };

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          onMouseDown={handleMouseDown}
          onPointerDown={handleMouseDown}
          disabled={disabled}
          className={cn(
            "h-9 w-9 p-0 rounded-lg",
            "bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200",
            "transition-all duration-200",
            isActive && "bg-gradient-to-br from-blue-200 to-blue-300 text-blue-800 border-blue-300",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs bg-gray-800 text-white px-2 py-1 rounded shadow-lg">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

export default ToolbarButton;
