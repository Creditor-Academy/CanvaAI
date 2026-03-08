import { useCallback } from 'react';
/**
 * CRITICAL ROBUST FIX: Scroll Lock Manager
 * 
 * Provides centralized scroll position locking to prevent unwanted jumps
 * during toolbar interactions.
 */

class ScrollLockManager {
  constructor() {
    this.isLocked = false;
    this.lockedPosition = 0;
    this.container = null;
    this.listeners = [];
  }

  /**
   * Lock scroll position immediately
   */
  lock(container) {
    if (!container) return;
    
    this.container = container;
    this.lockedPosition = container.scrollTop;
    this.isLocked = true;
    
    // Set global flag for other components to check
    window.isScrollLocked = true;
    window.lockedScrollTop = this.lockedPosition;
    
    // Add wheel listener to prevent scroll attempts
    container.addEventListener('wheel', this._handleWheel, { passive: false });
  }

  /**
   * Release scroll lock
   */
  unlock() {
    if (!this.container) return;
    
    this.isLocked = false;
    window.isScrollLocked = false;
    
    // Remove wheel listener
    this.container.removeEventListener('wheel', this._handleWheel);
    this.container = null;
  }

  /**
   * Restore locked scroll position
   */
  restore() {
    if (this.container && this.isLocked) {
      this.container.scrollTop = this.lockedPosition;
    }
  }

  /**
   * Get current locked position
   */
  getPosition() {
    return this.lockedPosition;
  }

  /**
   * Check if scroll is locked
   */
  getIsLocked() {
    return this.isLocked;
  }

  /**
   * Internal wheel handler to block scroll attempts
   */
  _handleWheel = (e) => {
    if (this.isLocked) {
      e.preventDefault();
    }
  };
}

// Create singleton instance
export const scrollLockManager = new ScrollLockManager();

/**
 * React hook for using scroll lock in components
 */
export function useScrollLock() {
  const lock = useCallback((container) => {
    scrollLockManager.lock(container);
  }, []);

  const unlock = useCallback(() => {
    scrollLockManager.unlock();
  }, []);

  const restore = useCallback(() => {
    scrollLockManager.restore();
  }, []);

  return { lock, unlock, restore };
}
