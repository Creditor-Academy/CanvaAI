import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';

// Resizable Image View Component
const ResizableImageView = ({ node, updateAttributes, editor }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: node.attrs.width || 300,
    height: node.attrs.height || 200
  });
  
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Update dimensions when node attributes change
  useEffect(() => {
    setDimensions({
      width: node.attrs.width || 300,
      height: node.attrs.height || 200
    });
  }, [node.attrs.width, node.attrs.height]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(100, e.clientX - rect.left); // Minimum width of 100px
      
      setDimensions(prev => ({
        ...prev,
        width: newWidth
      }));
    }
  };

  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false);
      // Update the node attributes with new dimensions
      updateAttributes({
        width: Math.round(dimensions.width),
        height: Math.round(dimensions.height)
      });
    }
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, dimensions.width]);

  const handleImageLoad = () => {
    // Calculate aspect ratio preserving height if width changes
    if (imgRef.current && !node.attrs.width && !node.attrs.height) {
      setDimensions({
        width: imgRef.current.naturalWidth > 400 ? 400 : imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight > 300 ? 300 : imgRef.current.naturalHeight
      });
    }
  };

  const containerStyle = {
    display: 'inline-block',
    position: 'relative',
    maxWidth: '100%',
    userSelect: 'none',
  };

  const imageStyle = {
    width: `${dimensions.width}px`,
    height: dimensions.height ? `${dimensions.height}px` : 'auto',
    maxWidth: '100%',
    objectFit: 'contain',
    border: '1px solid #ddd',
    borderRadius: '4px',
  };

  const resizeHandleStyle = {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    width: '12px',
    height: '12px',
    backgroundColor: '#4a90e2',
    cursor: 'nw-resize',
    borderRadius: '2px',
    zIndex: 10,
  };

  return (
    <NodeViewWrapper>
      <div
        ref={containerRef}
        style={containerStyle}
        className="resizable-image-container"
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          style={imageStyle}
          onLoad={handleImageLoad}
          draggable={false}
        />
        <div
          style={resizeHandleStyle}
          onMouseDown={handleMouseDown}
          className="resize-handle"
        />
      </div>
    </NodeViewWrapper>
  );
};

export const ResizableImage = Node.create({
  name: 'resizableImage',

  addOptions() {
    return {
      inline: true,
      allowBase64: true,
      HTMLAttributes: {
        class: 'resizable-image',
      },
    };
  },

  inline: true,
  group: 'inline',
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: '',
      },
      title: {
        default: '',
      },
      width: {
        default: 400,
        parseHTML: element => {
          const width = element.getAttribute('data-width') || element.style.width;
          if (width) {
            // Remove 'px' if present and parse as integer
            const num = parseInt(width.replace('px', ''), 10);
            return isNaN(num) ? 400 : num;
          }
          return 400;
        },
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return {
            'data-width': attributes.width,
            style: `width: ${attributes.width}px`,
          };
        },
      },
      height: {
        default: 300,
        parseHTML: element => {
          const height = element.getAttribute('data-height') || element.style.height;
          if (height) {
            // Remove 'px' if present and parse as integer
            const num = parseInt(height.replace('px', ''), 10);
            return isNaN(num) ? 300 : num;
          }
          return 300;
        },
        renderHTML: attributes => {
          if (!attributes.height) {
            return {};
          }
          return {
            'data-height': attributes.height,
            style: `height: ${attributes.height}px`,
          };
        },
      },
      align: {
        default: 'left',
        parseHTML: element => {
          const align = element.getAttribute('data-align') || 
                       element.style.float || 
                       element.style.textAlign;
          return align || 'left';
        },
        renderHTML: attributes => ({
          'data-align': attributes.align,
          style: `float: ${attributes.align};`,
        }),
      },
      // Additional metadata
      originalWidth: {
        default: null,
      },
      originalHeight: {
        default: null,
      },
      fileName: {
        default: '',
      },
      fileSize: {
        default: 0,
      },
      // Styling attributes
      class: {
        default: 'resizable-image',
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => {
          if (!attributes.class) {
            return { class: 'resizable-image' };
          }
          return { class: attributes.class };
        },
      },
      style: {
        default: 'max-width: 100%; height: auto;',
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => {
          const baseStyle = 'max-width: 100%; height: auto; cursor: pointer;';
          const customStyle = attributes.style || '';
          return { style: `${baseStyle} ${customStyle}`.trim() };
        },
      },
      // Border and styling
      borderColor: {
        default: '',
      },
      borderWidth: {
        default: 0,
      },
      borderRadius: {
        default: 0,
      },
      rotation: {
        default: 0,
      },
      opacity: {
        default: 100,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: dom => {
          const src = dom.getAttribute('src');
          const alt = dom.getAttribute('alt') || '';
          const title = dom.getAttribute('title') || alt;
          
          // Try to extract width and height from various sources
          let width = dom.getAttribute('width') || 
                     dom.getAttribute('data-width') || 
                     dom.style.width;
          let height = dom.getAttribute('height') || 
                      dom.getAttribute('data-height') || 
                      dom.style.height;
          
          // Parse numeric values
          if (width && typeof width === 'string') {
            const num = parseInt(width.replace('px', ''), 10);
            width = isNaN(num) ? 400 : num;
          }
          
          if (height && typeof height === 'string') {
            const num = parseInt(height.replace('px', ''), 10);
            height = isNaN(num) ? 300 : num;
          }
          
          return {
            src,
            alt,
            title,
            width: width || 400,
            height: height || 300,
            align: dom.getAttribute('data-align') || 
                  dom.style.float || 
                  dom.style.textAlign || 
                  'left',
            class: dom.getAttribute('class'),
            style: dom.getAttribute('style'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Ensure all required attributes are present
    const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
    
    // Ensure src is always present
    if (!attrs.src) {
      return ['div', {}, '⚠️ Missing image source'];
    }
    
    // Build style string
    let style = 'max-width: 100%; height: auto; cursor: pointer;';
    
    if (attrs.width) {
      style += ` width: ${attrs.width}px;`;
    }
    
    if (attrs.height) {
      style += ` height: ${attrs.height}px;`;
    }
    
    if (attrs.align) {
      style += ` float: ${attrs.align};`;
    }
    
    if (attrs.borderColor && attrs.borderWidth) {
      style += ` border: ${attrs.borderWidth}px solid ${attrs.borderColor};`;
    }
    
    if (attrs.borderRadius) {
      style += ` border-radius: ${attrs.borderRadius}px;`;
    }
    
    if (attrs.rotation) {
      style += ` transform: rotate(${attrs.rotation}deg);`;
    }
    
    if (attrs.opacity && attrs.opacity !== 100) {
      style += ` opacity: ${attrs.opacity / 100};`;
    }
    
    // Add custom style if provided
    if (attrs.style) {
      style += ` ${attrs.style}`;
    }
    
    // Build class string
    let className = 'resizable-image';
    if (attrs.class) {
      className += ` ${attrs.class}`;
    }
    
    return ['img', {
      ...attrs,
      class: className,
      style,
      alt: attrs.alt || '',
      title: attrs.title || attrs.alt || '',
      'data-type': 'resizable-image',
    }];
  },

  addCommands() {
    return {
      setResizableImage: (options) => ({ commands }) => {
        // Ensure required options
        const attrs = {
          src: options.src,
          alt: options.alt || '',
          title: options.title || options.alt || '',
          width: options.width || 400,
          height: options.height || 300,
          align: options.align || 'left',
          ...options,
        };
        
        return commands.insertContent({
          type: this.name,
          attrs,
        });
      },
      
      updateResizableImage: (options) => ({ commands }) => {
        return commands.updateAttributes(this.name, options);
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView, {
      // Pass additional options to the React component if needed
      className: 'resizable-image-wrapper',
    });
  },

  // Add keyboard shortcuts for image handling
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-I': () => this.editor.commands.setResizableImage({
        src: '',
        alt: 'New image',
        width: 400,
        height: 300,
      }),
      
      'Delete': ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const node = state.doc.nodeAt(selection.from);
        
        if (node && node.type.name === this.name) {
          editor.commands.deleteSelection();
          return true;
        }
        return false;
      },
    };
  },
});