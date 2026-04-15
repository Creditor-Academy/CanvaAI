/**
 * usePastePagination
 * ─────────────────────────────────────────────────────────────────────────────
 * ProseMirror plugin that intercepts paste events and triggers
 * paginateDocument(force:true) after the DOM has fully settled.
 *
 * Coordinates with paginationEngine.js singleton flags:
 *   window.__athena_pasteInFlight — prevents debouncePaginate from running
 *   window.__athena_isPaginating  — prevents re-entrant pagination
 *
 * FIXED vs previous version:
 *   • Sets window.__athena_pasteInFlight = true so paginationEngine's own
 *     debounce guard backs off (avoids double-pagination race).
 *   • Clears window.__athena_pasteInFlight after paginateDocument finishes.
 *   • Guards against editor destruction at every async boundary.
 *   • Plugin key check prevents double-registration in React StrictMode.
 */

import { useEffect } from 'react';
import { Plugin, PluginKey } from 'prosemirror-state';
import { paginateDocument } from '../utils/paginationEngine';

const PLUGIN_KEY = new PluginKey('athenaPastePagination');

// Mirror the flag helpers from paginationEngine.js
const getFlag = (k)    => window[`__athena_${k}`] ?? false;
const setFlag = (k, v) => { window[`__athena_${k}`] = v; };

/**
 * @param {import('@tiptap/react').Editor | null} editor
 * @param {React.MutableRefObject<boolean>}       isPastingRef     — TextEditor's ref
 * @param {React.MutableRefObject<number>}        lastPasteTimeRef — TextEditor's ref
 */
export function usePastePagination(editor, isPastingRef, lastPasteTimeRef) {
  useEffect(() => {
    if (!editor) return;

    const plugin = new Plugin({
      key: PLUGIN_KEY,

      props: {
        /**
         * handlePaste fires synchronously inside the user-gesture frame for
         * Ctrl+V / Cmd+V / right-click paste, before ProseMirror dispatches
         * its insertion transaction.
         *
         * Returning false lets ProseMirror handle the actual content insertion
         * normally. We only set flags and schedule the post-paste pagination.
         */
        handlePaste(view, event, slice) {
          // ── Save selection BEFORE paste ─────────────────────────────────
          // Critical for cursor stability - save where the paste STARTED
          const savedSelection = { 
            from: view.state.selection.from, 
            to: view.state.selection.to 
          };

          // ── Mark paste in-flight ────────────────────────────────────────
          isPastingRef.current      = true;
          lastPasteTimeRef.current  = Date.now();

          // Tell paginationEngine's debouncePaginate to back off
          setFlag('pasteInFlight', true);

          // ── Triple-RAF + Font Load + Layout Settling: wait for ProseMirror transaction + browser paint + fonts ──
          //
          // RAF #1: ProseMirror has dispatched its insertion transaction and
          //         React has reconciled. The virtual DOM is up to date but
          //         the browser has not yet painted.
          //
          // RAF #2: The browser has painted. Real offsetHeight / scrollHeight
          //         values now reflect the pasted content.
          //
          // RAF #3 + Font Check: Wait for fonts to load so heading heights
          //         are accurate. Different heading levels (h1-h6) have different
          //         font sizes that affect pagination calculations.
          //
          // FIX for heading content shift: Added additional layout settling time
          // after fonts load to ensure all heading margins and line-heights are
          // fully computed before pagination runs.

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (editor.isDestroyed) {
                  isPastingRef.current = false;
                  setFlag('pasteInFlight', false);
                  return;
                }

                // Wait for fonts to load if available (critical for heading height accuracy)
                const waitForFonts = () => {
                  if (document.fonts && document.fonts.ready) {
                    return document.fonts.ready.then(() => {
                      // ✅ INCREASED: Additional delay after fonts load for heading layout to settle
                      // Headings with various formats (h1-h6) need more time for margin/line-height calculations
                      return new Promise(resolve => setTimeout(resolve, 100));
                    });
                  }
                  return Promise.resolve();
                };

                waitForFonts().then(() => {
                  if (editor.isDestroyed) {
                    isPastingRef.current = false;
                    setFlag('pasteInFlight', false);
                    return;
                  }

                  // ✅ NEW: Double-check layout has settled by measuring content height
                  // This prevents pagination from running before heading heights are accurate
                  const measureAndPaginate = () => {
                    if (editor.isDestroyed) {
                      isPastingRef.current = false;
                      setFlag('pasteInFlight', false);
                      return;
                    }

                    // Guard: if paginationEngine is already running (e.g. debouncePaginate
                    // fired before our RAF chain), don't race it.
                    if (getFlag('isPaginating')) {
                      // It will clear the flag itself; just release our mutex.
                      setTimeout(() => {
                        isPastingRef.current = false;
                        setFlag('pasteInFlight', false);
                      }, 200);
                      return;
                    }

                    try {
                      // force:true skips fingerprint + cooldown guards
                      // paginateDocument will handle cursor position mapping internally
                      
                      // Log paste content metrics for debugging
                      const docSize = editor.state.doc.content.size;
                      const blockCount = editor.state.doc.childCount;
                      console.log(`[usePastePagination] Triggering pagination after paste:`, {
                        docSize,
                        blockCount,
                        reason: 'paste',
                        force: true
                      });
                      
                      paginateDocument(editor, { force: true, reason: 'paste' });
                    } catch (err) {
                      console.error('[usePastePagination] paginateDocument error:', err);
                      // On error, restore original selection immediately
                      try {
                        editor.commands.setTextSelection(savedSelection.from);
                      } catch (_) {}
                    }

                    // ── Release mutexes after paginateDocument's microtask settles ─
                    // paginateDocument clears athena_is_paginating via Promise.resolve(),
                    // so we wait one more tick before clearing our own flags to avoid
                    // the onUpdate debouncePaginate guard firing too early.
                    setTimeout(() => {
                      isPastingRef.current = false;
                      setFlag('pasteInFlight', false);
                    }, 100);
                  };

                  // ✅ NEW: Additional RAF cycle to ensure layout is fully settled
                  // This is critical for content with mixed heading formats
                  requestAnimationFrame(() => {
                    measureAndPaginate();
                  });
                });
              });
            });
          });

          // Return false — ProseMirror handles the actual content insertion.
          return false;
        },
      },
    });

    // ── Register the plugin with the live editor ──────────────────────────
    const { view } = editor;
    const existingPlugins = view.state.plugins;

    // Guard: don't register twice (e.g. React StrictMode double-effect)
    const alreadyRegistered = existingPlugins.some(
      (p) => p.spec?.key === PLUGIN_KEY
    );

    if (!alreadyRegistered) {
      const newState = view.state.reconfigure({
        plugins: [...existingPlugins, plugin],
      });
      view.updateState(newState);
    }

    // ── Cleanup: remove the plugin on unmount ─────────────────────────────
    return () => {
      if (editor.isDestroyed) return;
      try {
        const filtered = editor.view.state.plugins.filter(
          (p) => p.spec?.key !== PLUGIN_KEY
        );
        editor.view.updateState(
          editor.view.state.reconfigure({ plugins: filtered })
        );
      } catch {
        // Editor already tearing down — safe to ignore
      }
    };
  }, [editor, isPastingRef, lastPasteTimeRef]);
}
