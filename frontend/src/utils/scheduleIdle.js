/**
 * Cross-browser idle scheduler.
 * - Uses rIC when available (Chrome, Firefox, Edge)
 * - Falls back to MessageChannel micro-task on Safari
 * - Pauses when tab is hidden (document.hidden)
 * Returns a cancel function.
 */
export function scheduleIdle(cb, { timeout = 2000 } = {}) {
  if (document.hidden) {
    // Tab not visible — defer until visible again
    let cancelled = false;
    const onVisible = () => {
      if (cancelled) return;
      document.removeEventListener('visibilitychange', onVisible);
      scheduleIdle(cb, { timeout });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => { cancelled = true; };
  }

  if ('requestIdleCallback' in window) {
    const id = requestIdleCallback(cb, { timeout });
    return () => cancelIdleCallback(id);
  }

  // Safari: use MessageChannel for post-paint scheduling
  const channel = new MessageChannel();
  let cancelled = false;
  const hardTimeout = setTimeout(() => {
    if (!cancelled) cb({ timeRemaining: () => 0, didTimeout: true });
  }, timeout);

  channel.port1.onmessage = () => {
    clearTimeout(hardTimeout);
    if (!cancelled) cb({ timeRemaining: () => 50, didTimeout: false });
  };
  channel.port2.postMessage(undefined);

  return () => { cancelled = true; clearTimeout(hardTimeout); };
}
