import React from "react";
import { useUIStore } from "../../store/useUIStore";
import "./top-progress-bar.css";

export default function TopProgressBar() {
  const { isLoading, loadingType } = useUIStore();

  // Apply blur to the main content when top loader is active
  React.useEffect(() => {
    const rootElement = document.querySelector('.presentation-workspace-root');
    if (rootElement && isLoading && loadingType === "top") {
      rootElement.style.filter = 'blur(4px)';
      rootElement.style.pointerEvents = 'none';
      rootElement.style.transition = 'filter 0.3s ease, pointer-events 0.3s ease';
    } else if (rootElement) {
      // Remove blur when not loading or not top type
      rootElement.style.filter = '';
      rootElement.style.pointerEvents = '';
    }
    
    return () => {
      if (rootElement) {
        rootElement.style.filter = '';
        rootElement.style.pointerEvents = '';
      }
    };
  }, [isLoading, loadingType]);

  if (!isLoading || loadingType !== "top") return null;

  return (
    <div className="top-progress-bar">
      <div className="top-progress-bar-fill"></div>
    </div>
  );
}