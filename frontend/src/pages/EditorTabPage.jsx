import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import SafeTextEditor from '../components/athena-editor/SafeTextEditor';
import { TooltipProvider } from '../components/athena-editor/components/ui/tooltip';
import { useAutoCreateDocument } from '../components/athena-editor/hooks/useAutoCreateDocument';

const EditorTabPage = () => {
  const { mongoId: rawMongoId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Extract template type from URL query params
  const templateType = searchParams.get('template');
  
  // 🔥 CRITICAL: Convert "undefined" string to null
  const mongoId = (rawMongoId === 'undefined' || rawMongoId === 'null') ? null : rawMongoId;
  
  console.log('📍 EditorTabPage - raw mongoId:', rawMongoId, 'cleaned:', mongoId, 'template:', templateType);
  
  // 🔥 PRODUCTION: Auto-create document immediately when opening new document
  // This follows Google Docs pattern - document exists from the first millisecond
  const { isCreating, createdDocId } = useAutoCreateDocument(mongoId, navigate, templateType);
  
  // Use the created document ID if available, otherwise use mongoId from URL
  const effectiveMongoId = createdDocId || mongoId;
  
  console.log('📍 EditorTabPage rendering with:', { 
    mongoId, 
    createdDocId, 
    effectiveMongoId,
    templateType,
    url: window.location.pathname 
  });
  
  // Remove sidebar and other layout elements for standalone editor
  useEffect(() => {
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

  // Show loading state while creating document
  if (isCreating && !mongoId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Creating new document...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen w-full overflow-hidden">
        <SafeTextEditor key={effectiveMongoId || 'new'} mongoId={effectiveMongoId} />
      </div>
    </TooltipProvider>
  );
};

export default EditorTabPage;