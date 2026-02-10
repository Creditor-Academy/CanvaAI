import React from 'react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '../ui/tooltip';
import { cn } from '../utils';

export const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  children,
  className
}) => (
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
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

export default ToolbarButton;
