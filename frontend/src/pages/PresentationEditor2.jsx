import React from 'react';
import { PresentationWorkspace } from '../components/presentation2';

/**
 * PresentationEditor2 Page
 * 
 * Full-screen presentation editor that opens in a new tab.
 * No sidebar, no navigation - just the editor.
 */
const PresentationEditor2 = () => {
  // TODO: Load presentation from URL params or localStorage
  // TODO: Handle presentation save/export
  // TODO: Handle close/back navigation

  return (
    <div className="h-screen w-screen overflow-hidden">
      <PresentationWorkspace
        initialPresentation={null} // Will create empty presentation
        onClose={() => {
          // TODO: Handle close - maybe navigate back or close tab
          window.history.back();
        }}
      />
    </div>
  );
};

export default PresentationEditor2;
