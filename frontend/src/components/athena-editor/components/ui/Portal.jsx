// src/components/athena-editor/components/ui/Portal.jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal component to safely render content outside the React tree
 * This prevents flushSync warnings in React 18+ by deferring portal creation
 * 
 * @param {ReactNode} children - Content to render in the portal
 * @param {HTMLElement} [container] - Target container (default: document.body)
 */
const Portal = ({ children, container = null }) => {
  const [mounted, setMounted] = useState(false);
  const [portalContainer, setPortalContainer] = useState(null);

  useEffect(() => {
    // Set the container after mount to avoid flushSync issues
    setPortalContainer(container || document.body);
    setMounted(true);

    return () => {
      setMounted(false);
      setPortalContainer(null);
    };
  }, [container]);

  // Only render the portal after mounting
  if (!mounted || !portalContainer) {
    return null;
  }

  return createPortal(children, portalContainer);
};

export default Portal;
