import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { ToolbarButton } from '../../ui/ToolbarButton';
import { toast } from 'sonner';

export const ViewControls = ({ zoom, onZoomChange }) => {
  const handleZoomOut = () => {
    if (onZoomChange && typeof onZoomChange === 'function') {
      const currentZoom = zoom || 100;
      const newZoom = Math.max(50, currentZoom - 10);
      onZoomChange(newZoom);
    } else {
      console.error('onZoomChange is not available');
      toast.error('Zoom function not available');
    }
  };

  const handleZoomIn = () => {
    if (onZoomChange && typeof onZoomChange === 'function') {
      const currentZoom = zoom || 100;
      const newZoom = Math.min(200, currentZoom + 10);
      onZoomChange(newZoom);
    } else {
      console.error('onZoomChange is not available');
      toast.error('Zoom function not available');
    }
  };

  return (
    <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
      <ToolbarButton
        onClick={handleZoomOut}
        className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 border border-blue-200 transition-all duration-300"
      >
        <Minus className="w-5 h-5 text-blue-600" />
      </ToolbarButton>
      
      <div className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-700 min-w-[40px] text-center" style={{ flexShrink: 0 }}>
        {zoom || 100}%
      </div>
      
      <ToolbarButton
        onClick={handleZoomIn}
        className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 border border-blue-200 transition-all duration-300"
      >
        <Plus className="w-5 h-5 text-blue-600" />
      </ToolbarButton>
    </div>
  );
};
