import { Node, mergeAttributes } from '@tiptap/core';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorContext } from '../contexts/EditorContent.jsx';
import { USABLE_WIDTH_PX } from '../../../utils/pagination/constants';

// Resizable Image View Component
const ResizableImageView = ({ node, updateAttributes, editor, selected }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);
  const [dimensions, setDimensions] = useState({
    width: node.attrs.width || 400,
    height: node.attrs.height || 300
  });

  const { zoom = 100 } = useEditorContext() || {};
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startDims = useRef({ width: 0, height: 0 });
  const aspectRatio = useRef(1);

  // Sync state with node attributes when they change externally
  useEffect(() => {
    if (!isResizing) {
      setDimensions({
        width: node.attrs.width || 400,
        height: node.attrs.height || 300
      });
    }
  }, [node.attrs.width, node.attrs.height, isResizing]);

  const onResizeStart = (e, handle) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setActiveHandle(handle);

    startPos.current = { x: e.clientX, y: e.clientY };
    startDims.current = { width: dimensions.width, height: dimensions.height };

    if (imgRef.current) {
      aspectRatio.current = imgRef.current.naturalWidth / imgRef.current.naturalHeight || (dimensions.width / dimensions.height);
    }
  };

  const onResize = useCallback((e) => {
    if (!isResizing || !activeHandle) return;

    const currentZoom = (zoom || 100) / 100;
    const dx = (e.clientX - startPos.current.x) / currentZoom;
    const dy = (e.clientY - startPos.current.y) / currentZoom;

    let newWidth = startDims.current.width;
    let newHeight = startDims.current.height;

    // Standard behavior: corner handles lock aspect ratio by default. 
    // Holding Shift unlocks it.
    const lockAspect = !e.shiftKey;

    if (activeHandle === 'bottom-right') {
      newWidth = startDims.current.width + dx;
      newHeight = lockAspect ? newWidth / aspectRatio.current : startDims.current.height + dy;
    } else if (activeHandle === 'bottom-left') {
      newWidth = startDims.current.width - dx;
      newHeight = lockAspect ? newWidth / aspectRatio.current : startDims.current.height + dy;
    } else if (activeHandle === 'top-right') {
      newWidth = startDims.current.width + dx;
      newHeight = lockAspect ? newWidth / aspectRatio.current : startDims.current.height - dy;
    } else if (activeHandle === 'top-left') {
      newWidth = startDims.current.width - dx;
      newHeight = lockAspect ? newWidth / aspectRatio.current : startDims.current.height - dy;
    }

    // Constraints: Don't allow tiny images or wider than usable area
    newWidth = Math.max(48, Math.min(newWidth, USABLE_WIDTH_PX));
    if (lockAspect) {
      newHeight = newWidth / aspectRatio.current;
    } else {
      newHeight = Math.max(48, newHeight);
    }

    setDimensions({ width: Math.round(newWidth), height: Math.round(newHeight) });
  }, [isResizing, activeHandle, zoom]);

  const onResizeStop = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      setActiveHandle(null);
      updateAttributes({
        width: dimensions.width,
        height: dimensions.height
      });
      
      // Force immediate pagination to shift content to next page
      if (editor?.commands?.forceRepaginate) {
        editor.commands.forceRepaginate();
      }
    }
  }, [isResizing, dimensions, updateAttributes, editor]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', onResize);
      window.addEventListener('mouseup', onResizeStop);
      return () => {
        window.removeEventListener('mousemove', onResize);
        window.removeEventListener('mouseup', onResizeStop);
      };
    }
  }, [isResizing, onResize, onResizeStop]);

  const handleImageLoad = () => {
    if (imgRef.current && !node.attrs.width) {
      const naturalWidth = imgRef.current.naturalWidth;
      const naturalHeight = imgRef.current.naturalHeight;
      
      // Auto-scale to fit usable width if original is too large
      const maxWidth = Math.min(naturalWidth, USABLE_WIDTH_PX);
      const ratio = naturalHeight / naturalWidth;
      const initialWidth = maxWidth;
      const initialHeight = Math.round(maxWidth * ratio);

      setDimensions({ width: initialWidth, height: initialHeight });
      updateAttributes({ 
        width: initialWidth, 
        height: initialHeight,
        originalWidth: naturalWidth,
        originalHeight: naturalHeight
      });

      // Force immediate pagination to shift content after image loads
      if (editor?.commands?.forceRepaginate) {
        editor.commands.forceRepaginate();
      }
    }
  };

  const alignment = node.attrs.align || 'left';

  const containerStyle = {
    display: 'flex',
    justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
    width: '100%',
    margin: '1.5rem 0',
    userSelect: isResizing ? 'none' : 'auto',
  };

  const wrapperStyle = {
    position: 'relative',
    display: 'inline-block',
    lineHeight: 0,
    outline: selected || isResizing ? '2px solid #3b82f6' : '1px solid transparent',
    boxShadow: selected ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
    transition: 'outline 0.15s ease-in-out, shadow 0.15s ease-in-out',
    borderRadius: `${node.attrs.borderRadius || 0}px`,
    cursor: isResizing ? 'nwse-resize' : 'default',
  };

  const imgStyle = {
    width: `${dimensions.width}px`,
    height: 'auto', // Keep height auto for CSS fluidity, but controlled by width
    minWidth: '48px',
    display: 'block',
    borderRadius: `${node.attrs.borderRadius || 0}px`,
    border: node.attrs.borderWidth ? `${node.attrs.borderWidth}px solid ${node.attrs.borderColor || '#000'}` : 'none',
    opacity: (node.attrs.opacity || 100) / 100,
    transform: `rotate(${node.attrs.rotation || 0}deg)`,
    pointerEvents: isResizing ? 'none' : 'auto',
  };

  const handleStyle = {
    position: 'absolute',
    width: '12px',
    height: '12px',
    backgroundColor: '#3b82f6',
    border: '2px solid white',
    borderRadius: '2px', // Square handles for a more "design tool" look
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: 100,
    display: selected || isResizing ? 'block' : 'none',
    transition: 'transform 0.1s ease',
  };

  return (
    <NodeViewWrapper style={containerStyle}>
      <div style={wrapperStyle} className={`resizable-image-wrapper ${selected ? 'is-selected' : ''}`}>
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          style={imgStyle}
          onLoad={handleImageLoad}
          draggable={false}
        />

        {/* Only bottom-right corner handle per user preference */}
        <div onMouseDown={(e) => onResizeStart(e, 'bottom-right')} style={{ ...handleStyle, bottom: '-6px', right: '-6px', cursor: 'nwse-resize' }} />

        {/* Dimension Badge */}
        {(isResizing || selected) && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 101,
            opacity: isResizing ? 1 : 0.6,
          }}>
            {dimensions.width} × {dimensions.height}
          </div>
        )}

        {/* Selection Overlay */}
        {selected && !isResizing && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            pointerEvents: 'none',
          }} />
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ResizableImage = TiptapImage.extend({
  name: 'image', // Overrides standard image extension

  addOptions() {
    return {
      ...this.parent?.(),
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: 'resizable-image',
      },
    };
  },

  inline: false,
  group: 'block',
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      // Inherit all attributes from parent Image extension
      ...this.parent?.(),
      // Add resize-specific attributes
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

    if (attrs.align === 'center') {
      style += ` display: block; margin-left: auto; margin-right: auto; float: none;`;
    } else if (attrs.align) {
      style += ` float: ${attrs.align}; margin: 0.5rem;`;
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
    if (attrs.align) {
      className += ` align-${attrs.align}`;
    }
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
      setImage: (options) => ({ commands }) => {
        return commands.setResizableImage(options);
      },
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