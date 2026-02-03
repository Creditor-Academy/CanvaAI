import React from 'react';
import ReactDOM from 'react-dom/client';
import SimpleTextEditor from './SimpleTextEditor';

// Standalone editor that creates its own React root
class StandaloneEditor extends React.Component {
  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
    this.editorRoot = null;
    this.componentMounted = false;
  }

  componentDidMount() {
    this.componentMounted = true;
    // Create a completely isolated container
    const container = document.createElement('div');
    container.id = 'standalone-editor-container';
    container.style.width = '100%';
    container.style.height = '100%';
    
    // Append to our ref container
    if (this.containerRef.current) {
      this.containerRef.current.appendChild(container);
      
      // Create isolated React root
      this.editorRoot = ReactDOM.createRoot(container);
      
      // Render the editor in isolated context
      this.renderEditor();
    }
  }

  componentWillUnmount() {
    this.componentMounted = false;
    if (this.editorRoot) {
      // Use queueMicrotask to defer unmounting
      queueMicrotask(() => {
        if (this.editorRoot) {
          this.editorRoot.unmount();
          this.editorRoot = null;
        }
      });
    }
  }

  renderEditor = () => {
    console.log('StandaloneEditor: Starting renderEditor process');
    
    // Check if component is still mounted
    if (!this.componentMounted) {
      console.log('StandaloneEditor: Component not mounted, aborting');
      return;
    }
    
    console.log('StandaloneEditor: Component mounted, attempting to load editor');
    
    // Try to load the advanced editor first
    Promise.all([
      import('./components/TextEditor'),
      import('./components/ui/tooltip')
    ])
      .then(([{ TextEditor }, { TooltipProvider }]) => {
        console.log('StandaloneEditor: Editor components loaded successfully');
        
        // Double-check mounting status after async operation
        if (!this.componentMounted || !this.editorRoot) {
          console.log('StandaloneEditor: Component unmounted during async load, aborting');
          return;
        }
        
        console.log('StandaloneEditor: Rendering editor in isolated root');
        
        // Render with TooltipProvider in the isolated root
        this.editorRoot.render(
          <TooltipProvider>
            <TextEditor />
          </TooltipProvider>
        );
      })
      .catch((error) => {
        console.error('StandaloneEditor: Advanced editor failed:', error);
        console.warn('Advanced editor failed, falling back to simple editor:', error);
        
        // Fall back to simple editor
        if (this.componentMounted && this.editorRoot) {
          console.log('StandaloneEditor: Rendering simple editor fallback');
          this.editorRoot.render(<SimpleTextEditor />);
        }
      });
  };

  render() {
    return (
      <div 
        ref={this.containerRef} 
        className="w-full h-full"
        style={{ minHeight: '100vh' }}
      >
        {/* Loading indicator */}
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading editor...</p>
          </div>
        </div>
      </div>
    );
  }
}

export default StandaloneEditor;