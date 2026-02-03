import React from 'react';
import SafeTextEditor from './SafeTextEditor';
import { TooltipProvider } from './components/ui/tooltip';

const AthenaEditorPage = () => {
  return (
    <TooltipProvider>
      <div className="h-screen w-full">
        <SafeTextEditor />
      </div>
    </TooltipProvider>
  );
};

export default AthenaEditorPage;