import { useState, useEffect, useRef, useCallback } from 'react';
import usePresentationStore from '../store/usePresentationStore';
import { useAuth } from '../../../contexts/AuthContext';
import { updatePresentation, savePresentation } from "../../../services/presentation";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "../store/useUIStore";

export const useAutoSave = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { presentationId, slides, title, setPresentationId, pastCount } = usePresentationStore();

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Keep a ref to the latest state so the timer callbacks don't have stale closures
  const stateRef = useRef({ presentationId, slides, title, hasUnsavedChanges, isSaving });
  useEffect(() => {
    stateRef.current = { presentationId, slides, title, hasUnsavedChanges, isSaving };
  }, [presentationId, slides, title, hasUnsavedChanges, isSaving]);

  // Keep user in a ref so performSave always reads the latest value
  // regardless of when useCallback was memoized
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // Keep navigate in a ref for the same reason
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // Use a ref for isSaving to prevent race conditions between concurrent save calls
  const isSavingRef = useRef(false);

  // Track pastCount changes to detect editor edits (text, layer adds, etc.)
  const prevPastCountRef = useRef(pastCount);
  useEffect(() => {
    if (pastCount > prevPastCountRef.current) {
      setHasUnsavedChanges(true);
    }
    prevPastCountRef.current = pastCount;
  }, [pastCount]);

  // Also catch slide changes that bypass history (e.g. text debounce updates).
  // prevSlidesRef is synced to the loaded slides whenever presentationId changes so that
  // the slides effect doesn't fire a false-positive on initial load (both presentationId
  // and slides change in the same Zustand set() call, effects run in declaration order).
  const prevSlidesRef = useRef(slides);
  const presentationLoadedRef = useRef(false);
  useEffect(() => {
    if (presentationId) {
      presentationLoadedRef.current = true;
      // Sync prevSlidesRef to the just-loaded slides so the [slides] effect below
      // (which runs after this one in the same render cycle) sees no diff on load.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      prevSlidesRef.current = slides;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationId]); // intentionally omit `slides` — only sync on presentationId change
  useEffect(() => {
    // NOTE: isSavingRef guard intentionally removed — edits made during an in-progress
    // save must still be flagged so they are picked up by the NEXT autosave cycle.
    if (presentationLoadedRef.current && slides !== prevSlidesRef.current) {
      setHasUnsavedChanges(true);
    }
    prevSlidesRef.current = slides;
  }, [slides]);

  const markUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const performSave = useCallback(async (isManual = false) => {
    const currentState = stateRef.current;
    const currentUser  = userRef.current;

    console.log('[AutoSave] performSave called', {
      isManual,
      presentationId: currentState.presentationId,
      hasUnsavedChanges: currentState.hasUnsavedChanges,
      isSaving: isSavingRef.current,
      userId: currentUser?._id,
    });

    // Safety checks
    if (!currentState.hasUnsavedChanges && !isManual) {
      console.log('[AutoSave] Skipped: no unsaved changes');
      return;
    }
    if (isSavingRef.current) {
      console.log('[AutoSave] Skipped: already saving');
      return; // Prevent parallel API calls (ref-based, no stale closure)
    }

    // For autosave, we only save if it's an existing presentation
    if (!currentState.presentationId && !isManual) {
      console.log('[AutoSave] Skipped: no presentationId for autosave');
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = {
        userId: currentUser?._id,
        title: currentState.title || "Untitled Presentation",
        data: {
          slides: currentState.slides,
        }
      };

      const savePromise = currentState.presentationId
        ? updatePresentation(currentState.presentationId, payload)
        : savePresentation(payload);

      // Enforce minimum 500ms spinner so save feels acknowledged
      const minimumDelay = new Promise(resolve => setTimeout(resolve, 500));

      const [res] = await Promise.all([savePromise, minimumDelay]);
      console.log('[AutoSave] Save succeeded', res);

      if (!currentState.presentationId) {
        // New presentation — store the generated ID and update the URL
        const newId = res?.presentationId || res?._id || res?.id || res?.data?._id || res?.data?.id;
        if (newId) {
          setPresentationId(newId);
          if (isManual) {
            navigateRef.current(`/presentation-editor-v3/${newId}`, { replace: true });
          }
        }
      }

      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());

      if (isManual) {
        useUIStore.getState().addNotification(
          currentState.presentationId ? "Changes saved successfully!" : "Presentation saved successfully!",
          "success"
        );
      }
    } catch (error) {
      console.error('[AutoSave] Save FAILED:', error?.response?.data || error?.message || error);
      setSaveError(error);
      if (isManual) {
        useUIStore.getState().addNotification("Failed to save presentation.", "error");
      }
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  // No stale-closure risk — all values read through refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPresentationId]);

  // Debounced Autosave (5 seconds)
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timerId = setTimeout(() => {
      performSave(false);
    }, 5000);

    return () => clearTimeout(timerId);
  }, [hasUnsavedChanges, presentationId, slides, title, performSave]); // Depend on content to reset timer on edit

  // Force Save (20 seconds)
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const intervalId = setInterval(() => {
      if (stateRef.current.hasUnsavedChanges) {
        performSave(false);
      }
    }, 20000);

    return () => clearInterval(intervalId);
  }, [hasUnsavedChanges, presentationId, performSave]);

  // Window beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    isSaving,
    hasUnsavedChanges,
    lastSavedAt,
    saveError,
    markUnsaved,
    manualSave: () => performSave(true)
  };
};

export default useAutoSave;
