import React from 'react';

export const EditorFooter = ({
  wordCount,
  characterCount,
  readingTime,
  saveStatus,
  zoom
}) => {
  return (
    <footer className="flex items-center justify-between px-4 py-1.5 bg-gray-50/30 text-xs text-gray-500 border-t border-gray-200/50">
      <div className="flex items-center gap-3">
        <span>{wordCount} words</span>
        <span>{characterCount} chars</span>
        <span>{readingTime}m read</span>
        <div className="flex items-center gap-1.5 pl-3 border-l border-gray-300/50">
          <div className={`w-2 h-2 rounded-full ${saveStatus === 'modified' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
          <span className={saveStatus === 'modified' ? 'text-orange-600' : 'text-green-600'}>
            {saveStatus === 'modified' ? 'Unsaved' : 'Saved'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span>{zoom}%</span>
      </div>
    </footer>
  );
};
