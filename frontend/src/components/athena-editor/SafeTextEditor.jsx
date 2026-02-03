import React from 'react';
import { TooltipProvider } from './components/ui/tooltip';

// Direct editor implementation without complex isolation
const SafeTextEditor = () => {
  // Try to load the editor directly with error boundary pattern
  const [editorLoaded, setEditorLoaded] = React.useState(false);
  const [editorError, setEditorError] = React.useState(null);
  
  React.useEffect(() => {
    const loadEditor = async () => {
      try {
        const { TextEditor } = await import('./components/TextEditor.jsx');
        const EditorComponent = TextEditor;
        
        // Store the component type for rendering
        window.EditorComponent = EditorComponent;
        setEditorLoaded(true);
      } catch (error) {
        console.error('Failed to load editor:', error);
        setEditorError(error);
      }
    };
    
    loadEditor();
  }, []);
  
  if (editorError) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Editor Failed to Load</h2>
          <p className="text-gray-600 mb-4">There was an error loading the text editor.</p>
          <p className="text-sm text-gray-500">Error: {editorError.message}</p>
        </div>
      </div>
    );
  }
  
  if (!editorLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }
  
  // Render the editor component directly
  const EditorComponent = window.EditorComponent;
  
  return (
    <TooltipProvider>
      <div className="h-screen w-full overflow-hidden">
        <EditorComponent />
      </div>
    </TooltipProvider>
  );
};

export default SafeTextEditor;
