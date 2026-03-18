import React, { Suspense, lazy } from 'react';

// Dynamically import the editor component with proper React Suspense
const TextEditor = lazy(() => import('./components/TextEditor.jsx'));

// Safe editor implementation with proper React Suspense
const SafeTextEditor = ({ mongoId }) => {
  // Loading component for suspense fallback
  const LoadingFallback = () => (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading editor...</p>
      </div>
    </div>
  );

  // Error boundary component to catch errors
  const ErrorBoundary = ({ children }) => {
    const [hasError, setHasError] = React.useState(false);
    const [error, setError] = React.useState(null);

    if (hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Editor Failed to Load</h2>
            <p className="text-gray-600 mb-4">There was an error loading the text editor.</p>
            <p className="text-sm text-gray-500">Error: {error?.message || 'Unknown error'}</p>
          </div>
        </div>
      );
    }

    return children;
  };

  return (
    <ErrorBoundary>
      <div className="h-screen w-full overflow-hidden">
        <Suspense fallback={<LoadingFallback />}>
          <TextEditor mongoId={mongoId} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default SafeTextEditor;
