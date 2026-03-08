import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorContext } from '../contexts/EditorContent.jsx';

// Resizable Image View Component
const ResizableImageView = ({ node, updateAttributes, editor, selected }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);
  const [dimensions, setDimensions] = useState({
    width: node.attrs.width || 300,
    height: node.attrs.height || 200
  });

  const { zoom = 100 } = useEditorContext() || {};
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startDims = useRef({ width: 0, height: 0 });
  const aspectRatio = useRef(1);

  useEffect(() => {
    setDimensions({
      width: node.attrs.width || 300,
      height: node.attrs.height || 200
    });
  }, [node.attrs.width, node.attrs.height]);

  const onResizeStart = (e, handle) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setActiveHandle(handle);

    startPos.current = { x: e.clientX, y: e.clientY };
    startDims.current = { width: dimensions.width, height: dimensions.height };

    if (imgRef.current) {
      aspectRatio.current = imgRef.current.naturalWidth / imgRef.current.naturalHeight;
    }
  };

  const onResize = useCallback((e) => {
    if (!isResizing || !activeHandle) return;

    // Acknowledge the editor's zoom level for accurate movement
    const currentZoom = (zoom || 100) / 100;
    const dx = (e.clientX - startPos.current.x) / currentZoom;
    const dy = (e.clientY - startPos.current.y) / currentZoom;

    let newWidth = startDims.current.width;
    let newHeight = startDims.current.height;

    // Professional convention: Shifting LOCKS aspect ratio. 
    // If not shifted, we might want to lock by default for corners but free for edges.
    // However, to keep it simple and robust, let's stick to a clear rule.
    const isShiftPressed = e.shiftKey;
    const lockAspect = !isShiftPressed; // Locked by default, unlocked with Shift

    switch (activeHandle) {
      case 'bottom-right':
        newWidth = startDims.current.width + dx;
        newHeight = lockAspect ? newWidth / aspectRatio.current : startDims.current.height + dy;
        break;
      case 'bottom-left':
        newWidth = startDims.current.width - dx;
        newHeight = lockAspect ? newWidth / aspectRatio.current : startDims.current.height + dy;
        break;
      case 'top-right':
        newWidth = startDims.current.width + dx;
        newHeight = lockAspect ? newWidth / aspectRatio.current : startDims.current.height - dy;
        break;
      case 'top-left':
        newWidth = startDims.current.width - dx;
        newHeight = lockAspect ? newWidth / aspectRatio.current : startDims.current.height - dy;
        break;
      case 'right':
        newWidth = startDims.current.width + dx;
        if (lockAspect && !activeHandle.includes('-')) newHeight = newWidth / aspectRatio.current;
        break;
      case 'left':
        newWidth = startDims.current.width - dx;
        if (lockAspect && !activeHandle.includes('-')) newHeight = newWidth / aspectRatio.current;
        break;
      case 'bottom':
        newHeight = startDims.current.height + dy;
        if (lockAspect && !activeHandle.includes('-')) newWidth = newHeight * aspectRatio.current;
        break;
      case 'top':
        newHeight = startDims.current.height - dy;
        if (lockAspect && !activeHandle.includes('-')) newWidth = newHeight * aspectRatio.current;
        break;
    }

    // Constraints: Don't allow tiny images or wider than A4/Screen (increased limit to 2000px)
    newWidth = Math.max(50, Math.min(newWidth, 2000));
    newHeight = Math.max(50, newHeight);

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
    }
  }, [isResizing, dimensions, updateAttributes]);

  useEffect(() => {
    if (isResizing) {
      // NOTE: We don't include 'dimensions' in dependency to avoid re-adding listeners every pixel
      // We rely on the refs for start values and local state for visual update
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
      const initialWidth = Math.min(naturalWidth, 2000);
      const initialHeight = Math.round(initialWidth * (naturalHeight / naturalWidth));

      setDimensions({ width: initialWidth, height: initialHeight });
      updateAttributes({ width: initialWidth, height: initialHeight });
    }
  };

  const alignment = node.attrs.align || 'left';

  const containerStyle = {
    display: 'block',
    textAlign: alignment === 'center' ? 'center' : alignment,
    width: '100%',
    clear: 'both',
    margin: '1rem 0',
    lineHeight: 0
  };

  const wrapperStyle = {
    position: 'relative',
    display: 'inline-block',
    lineHeight: 0,
    maxWidth: '100%',
    outline: selected ? '2px solid #3b82f6' : 'none',
    transition: 'outline 0.1s ease-in-out',
    borderRadius: `${node.attrs.borderRadius || 0}px`,
  };

  const imgStyle = {
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    maxWidth: '100%',
    objectFit: 'contain',
    display: 'block',
    borderRadius: `${node.attrs.borderRadius || 0}px`,
    border: node.attrs.borderWidth ? `${node.attrs.borderWidth}px solid ${node.attrs.borderColor || '#000'}` : 'none',
    opacity: (node.attrs.opacity || 100) / 100,
    transform: `rotate(${node.attrs.rotation || 0}deg)`,
  };

  // Helper for handles
  const renderHandle = (type, positionStyle) => (
    <div
      onMouseDown={(e) => onResizeStart(e, type)}
      style={{
        position: 'absolute',
        width: '10px',
        height: '10px',
        backgroundColor: '#3b82f6',
        border: '1px solid white',
        borderRadius: '50%',
        zIndex: 100,
        cursor: type.includes('-') ? `${type.replace('top', 'nw').replace('bottom', 'se').replace('left', 'sw').replace('right', 'ne')}-resize` : `${type === 'left' || type === 'right' ? 'ew' : 'ns'}-resize`,
        ...positionStyle,
        display: selected || isResizing ? 'block' : 'none'
      }}
    />
  );

  return (
    <NodeViewWrapper style={containerStyle}>
      <div style={wrapperStyle} className="resizable-image-wrapper">
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          style={imgStyle}
          onLoad={handleImageLoad}
          draggable={false}
        />

        {/* Corner Handles */}
        {renderHandle('top-left', { top: '-5px', left: '-5px' })}
        {renderHandle('top-right', { top: '-5px', right: '-5px' })}
        {renderHandle('bottom-left', { bottom: '-5px', left: '-5px' })}
        {renderHandle('bottom-right', { bottom: '-5px', right: '-5px' })}

        {/* Edge Handles */}
        {renderHandle('top', { top: '-5px', left: '50%', marginLeft: '-5px' })}
        {renderHandle('bottom', { bottom: '-5px', left: '50%', marginLeft: '-5px' })}
        {renderHandle('left', { left: '-5px', top: '50%', marginTop: '-5px' })}
        {renderHandle('right', { right: '-5px', top: '50%', marginTop: '-5px' })}

        {isResizing && (
          <div style={{
            position: 'absolute',
            top: '5px',
            left: '5px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            pointerEvents: 'none'
          }}>
            {dimensions.width} x {dimensions.height}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ResizableImage = Node.create({
  name: 'resizableImage',

  addOptions() {
    return {
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