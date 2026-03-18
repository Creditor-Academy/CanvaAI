import React from 'react';
import { useParams } from 'react-router-dom';
import SafeTextEditor from '../components/athena-editor/SafeTextEditor';
import { TooltipProvider } from '../components/athena-editor/components/ui/tooltip';

const EditorTabPage = () => {
  const { mongoId } = useParams();
  
  // Remove sidebar and other layout elements for standalone editor
  React.useEffect(() => {
    // Hide sidebar when this page loads
    const appContent = document.querySelector('.app-content');
    if (appContent) {
      appContent.style.marginLeft = '0';
    }
    
    // Clean up on unmount
    return () => {
      const sidebar = document.querySelector('[class*="sidebar"]');
      if (sidebar) {
        const isCollapsed = sidebar.style.width === '60px';
        const marginLeft = isCollapsed ? '60px' : '260px';
        if (appContent) {
          appContent.style.marginLeft = marginLeft;
        }
      }
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="h-screen w-full overflow-hidden">
        <SafeTextEditor mongoId={mongoId} />
      </div>
    </TooltipProvider>
  );
};

export default EditorTabPage;