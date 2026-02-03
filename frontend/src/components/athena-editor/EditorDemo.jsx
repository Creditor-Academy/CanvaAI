import React from 'react';
import SafeTextEditor from './SafeTextEditor';

const EditorDemo = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <SafeTextEditor />
        </div>
      </div>
    </div>
  );
};

export default EditorDemo;