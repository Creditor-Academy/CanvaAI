import React, { useState } from 'react';
import { Textarea } from './components/ui/textarea';
import { Button } from './components/ui/button';
import { Save, Download } from 'lucide-react';
import { toast } from 'sonner';

// Simple fallback editor when advanced editor fails
const SimpleTextEditor = () => {
  const [content, setContent] = useState('# Welcome to Simple Editor\n\nStart typing your document here...\n\n## Features\n- Basic text editing\n- Save functionality\n- Export options\n\n> This is a fallback editor that works when the advanced editor encounters issues.');
  const [title, setTitle] = useState('Simple Document');

  const handleSave = () => {
    const documentData = {
      title,
      content,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('simple-editor-document', JSON.stringify(documentData));
    toast.success('Document saved locally!');
  };

  const handleExport = (format) => {
    let data, filename, mimeType;
    
    switch(format) {
      case 'txt':
        data = content;
        filename = `${title}.txt`;
        mimeType = 'text/plain';
        break;
      case 'md':
        data = content;
        filename = `${title}.md`;
        mimeType = 'text/markdown';
        break;
      case 'html':
        data = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1, h2, h3 { margin-top: 1.5em; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <pre>${content}</pre>
</body>
</html>`;
        filename = `${title}.html`;
        mimeType = 'text/html';
        break;
      default:
        return;
    }
    
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Simple Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">📝</span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent border-none text-lg font-medium focus:outline-none"
            placeholder="Document title"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} variant="outline" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          
          <div className="relative group">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <div className="absolute right-0 mt-1 w-32 bg-popover border rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:block">
              <button 
                onClick={() => handleExport('txt')}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-secondary"
              >
                Plain Text
              </button>
              <button 
                onClick={() => handleExport('md')}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-secondary"
              >
                Markdown
              </button>
              <button 
                onClick={() => handleExport('html')}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-secondary"
              >
                HTML
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor Area */}
      <div className="flex-1 p-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full min-h-[500px] p-4 text-base leading-relaxed resize-none font-mono"
          placeholder="Start writing your document..."
        />
      </div>

      {/* Status Bar */}
      <footer className="px-4 py-2 border-t border-border bg-background text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Simple Editor Mode</span>
          <span>{content.length} characters</span>
        </div>
      </footer>
    </div>
  );
};

export default SimpleTextEditor;