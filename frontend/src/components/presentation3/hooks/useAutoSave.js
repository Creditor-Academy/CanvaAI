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

  // Track pastCount changes to detect editor edits
  const prevPastCountRef = useRef(pastCount);
  useEffect(() => {
    if (pastCount > prevPastCountRef.current) {
      setHasUnsavedChanges(true);
    }
    prevPastCountRef.current = pastCount;
  }, [pastCount]);

  const markUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const performSave = useCallback(async (isManual = false) => {
    const currentState = stateRef.current;
    
    // Safety checks
    if (!currentState.hasUnsavedChanges && !isManual) return;
    if (currentState.isSaving) return; // Prevent parallel API calls
    
    // For autosave, we only save if it's an existing presentation
    if (!currentState.presentationId && !isManual) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = {
        userId: user?._id,
        title: currentState.title || "Untitled Presentation",
        data: {
          slides: currentState.slides,
        }
      };

      const savePromise = currentState.presentationId
        ? updatePresentation(currentState.presentationId, payload)
        : savePresentation(payload);

      // Enforce minimum 500ms spinner
      const minimumDelay = new Promise(resolve => setTimeout(resolve, 500));
      
      const [res] = await Promise.all([savePromise, minimumDelay]);

      if (!currentState.presentationId) {
        // If it was a new presentation, set the ID
        const newId = res.presentationId || res._id || res.id || (res.data && (res.data._id || res.data.id));
        if (newId) {
          setPresentationId(newId);
          if (isManual) {
             navigate(`/presentation-editor-v3/${newId}`, { replace: true });
          }
        }
      }

      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());

      if (isManual) {
         useUIStore.getState().addNotification(currentState.presentationId ? "Changes saved successfully!" : "Presentation saved successfully!", "success");
      }
    } catch (error) {
      console.error("Save failed:", error);
      setSaveError(error);
      if (isManual) {
         useUIStore.getState().addNotification("Failed to save presentation.", "error");
      }
    } finally {
      setIsSaving(false);
    }
  }, [user?._id, setPresentationId]);

  // Debounced Autosave (5 seconds)
  useEffect(() => {
    if (!hasUnsavedChanges || !presentationId) return;

    const timerId = setTimeout(() => {
      performSave(false);
    }, 5000);

    return () => clearTimeout(timerId);
  }, [hasUnsavedChanges, presentationId, slides, title, performSave]); // Depend on content to reset timer on edit

  // Force Save (20 seconds)
  useEffect(() => {
    if (!hasUnsavedChanges || !presentationId) return;

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
