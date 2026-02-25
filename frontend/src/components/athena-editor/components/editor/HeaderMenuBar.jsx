import React from 'react';
import { Save, Download, Trash2 } from 'lucide-react';

const HeaderMenuBar = ({
  onSave,
  onExport,
  onDelete
}) => {
  return (
    <div className="flex items-center gap-2 h-full">
      <button
        onClick={onSave}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#FFB000] hover:bg-[#e69e00] text-black rounded-full font-medium text-sm transition-colors"
      >
        <Save className="w-4 h-4" />
        <span>Save</span>
      </button>

      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2875FF] hover:bg-[#1d63e0] text-white rounded-full font-medium text-sm transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      <button
        onClick={onDelete}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-transparent hover:bg-neutral-100 text-[#e60000] rounded-full font-medium text-sm transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete</span>
      </button>
    </div>
  );
};

export { HeaderMenuBar };