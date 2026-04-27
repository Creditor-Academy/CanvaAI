/**
 * useDocumentPersistence Hook
 * 
 * Handles all document save/load operations including:
 * - Auto-save with debouncing
 * - Manual save
 * - beforeunload protection
 * - Token usage persistence
 * - Document state management
 * 
 * @module useDocumentPersistence
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash';
import { toast } from 'sonner';
import { TextEditorService } from '../../../services/Text-Editor/text.service.js';
import { getTokenUsageForSave } from '../../../utils/tokenPersistence.js';

// 🔥 PRODUCTION FIX: Strip base64 images from JSON before saving to prevent DB bloat
const stripBase64Images = (json) => {
  if (!json) return json;
  const walk = (node) => {
    if (!node) return node;
    if (node.type === 'image' || node.type === 'resizableImage') {
      if (node.attrs?.src?.startsWith('data:')) {
        console.warn('[stripBase64Images] Stripping large base64 image to prevent DB overflow');
        return { ...node, attrs: { ...node.attrs, src: '' } };
      }
    }
    if (node.content) {
      return { ...node, content: node.content.map(walk) };
    }
    return node;
  };
  return walk(json);
};

/**
 * Custom hook for document persistence
 * 
 * @param {Object} options
 * @param {string} options.docId - Current document ID
 * @param {Object} options.editor - TipTap editor instance
 * @param {Function} options.onMongoIdSaved - Callback when new document is saved
 * @param {string} options.documentTitle - Current document title
 * @returns {Object} Persistence state and handlers
 */
export function useDocumentPersistence({
  docId,
  editor,
  onMongoIdSaved,
  documentTitle,
}) {
  // State
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'modified' | 'error'
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs
  const docIdRef = useRef(docId);
  const editorRef = useRef(editor);
  const documentTitleRef = useRef(documentTitle);
  const saveRef = useRef(null);
  const hasUnsavedChangesRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    docIdRef.current = docId;
  }, [docId]);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    documentTitleRef.current = documentTitle;
  }, [documentTitle]);

  /**
   * Debounced auto-save function
   * Created once on mount and reused
   */
  useEffect(() => {
    // Initialize debounced save function
    if (!saveRef.current) {
      saveRef.current = debounce(async () => {
        const id = docIdRef.current;
        const ed = editorRef.current;

        if (!id || !ed || ed.isDestroyed) {
          console.log('⏭️ Skipping save - no document ID or editor not ready');
          return;
        }

        // Validate MongoDB ObjectId format
        const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(id);
        if (!isValidMongoId) {
          console.log('⏭️ Skipping save - invalid MongoDB ObjectId:', id);
          return;
        }

        // Skip auto-save for temporary template documents
        const isTemporaryDoc = id.startsWith('doc_');
        if (isTemporaryDoc) {
          const tempDoc = sessionStorage.getItem(`doc_${id}`);
          if (tempDoc) {
            console.log('⏭️ Skipping auto-save for temporary template document:', id);
            setSaveStatus('saved');
            setLastSaved(new Date());
            return;
          }
          console.log('📝 Template document was saved to backend - continuing auto-save');
        }

        try {
          // Save as TipTap JSON
          // 🔥 PRODUCTION FIX: Strip base64 to prevent MongoDB 16MB document limit crash
          const jsonContent = stripBase64Images(ed.state.doc.toJSON());
          const htmlContent = ed.getHTML();
          const tokenUsageData = getTokenUsageForSave(id);

          console.log('💾 Auto-saving document:', id);

          await TextEditorService.updateDocument(id, {
            data: {
              content: jsonContent,
              html: htmlContent
            },
            hasBeenEdited: true,
            ...(tokenUsageData && { metadata: { tokenUsage: tokenUsageData } }),
            updatedAt: new Date()
          });

          setSaveStatus('saved');
          setLastSaved(new Date());
          hasUnsavedChangesRef.current = false;
          console.log(`✅ Document ${id} auto-saved successfully`, tokenUsageData ? 'with token usage' : '');
        } catch (error) {
          setSaveStatus('error');
          console.error('❌ Auto-save failed:', error);
          
          // Show specific error messages
          if (error.response?.status === 400) {
            toast.error('Invalid document ID format. Please refresh and try again.');
          } else if (error.response?.status === 404) {
            toast.error('Document not found. It may have been deleted.');
          } else if (error.response?.status >= 500) {
            toast.error('Server error. Please try again later.');
          } else if (!error.response) {
            toast.error('Cannot connect to server. Please check your internet connection.');
          } else {
            toast.error('Failed to save document. Please check your connection.');
          }
        }
      }, 1000); // Wait 1 second after user stops typing
    }

    // Cleanup on unmount
    return () => {
      if (saveRef.current) {
        saveRef.current.flush(); // 🔥 PRODUCTION FIX: Flush instead of cancel to prevent data loss
        console.log('[AutoSave] Flushing pending save on unmount');
      }
    };
  }, []);

  /**
   * Manual save handler - saves immediately without debounce
   */
  const handleSave = useCallback(async () => {
    const ed = editorRef.current;
    if (!ed || ed.isDestroyed) {
      toast.error('Editor not ready');
      return;
    }

    setIsSaving(true);
    setSaveStatus('modified');

    try {
      const effectiveDocId = docIdRef.current;
      const isTemporaryId = typeof effectiveDocId === 'string' && effectiveDocId.startsWith('doc_');

      if (effectiveDocId && !isTemporaryId) {
        // Update existing document
        console.log('📝 Updating existing document with ID:', effectiveDocId);

        await TextEditorService.updateDocument(effectiveDocId, {
          title: documentTitleRef.current,
          data: {
            // 🔥 PRODUCTION FIX: Strip base64
            content: stripBase64Images(ed.getJSON()),
            html: ed.getHTML()
          },
          hasBeenEdited: true
        });

        setLastSaved(new Date());
        setSaveStatus('saved');
        hasUnsavedChangesRef.current = false;
        toast.success('Document saved to backend successfully! 💾');

        // Notify other tabs to refresh
        localStorage.setItem('athena_document_refresh', Date.now().toString());
      } else {
        // Create new document
        console.log('🆕 No document ID - saving as NEW document');
        
        const result = await TextEditorService.saveDocument({
          title: documentTitleRef.current || 'Untitled Document',
          data: {
            // 🔥 PRODUCTION FIX: Strip base64
            content: stripBase64Images(ed.getJSON()),
            html: ed.getHTML()
          }
        });

        setLastSaved(new Date());
        setSaveStatus('saved');
        hasUnsavedChangesRef.current = false;
        toast.success('New document saved to backend successfully! 💾');

        // Notify parent of new document ID
        onMongoIdSaved?.(null, result.id);

        // Notify other tabs
        localStorage.setItem('athena_document_refresh', Date.now().toString());
      }
    } catch (error) {
      console.error('Backend save error:', error);
      toast.error('Failed to save to backend: ' + (error.message || 'Unknown error'));
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [onMongoIdSaved]);

  /**
   * Trigger debounced save (for auto-save)
   */
  const triggerAutoSave = useCallback((jsonContent) => {
    if (saveRef.current && !isSaving) {
      saveRef.current(jsonContent);
      hasUnsavedChangesRef.current = true;
      setSaveStatus('modified');
    }
  }, [isSaving]);

  /**
   * Cancel pending saves
   */
  const cancelPendingSaves = useCallback(() => {
    if (saveRef.current) {
      saveRef.current.cancel();
    }
  }, []);

  /**
   * Beforeunload handler - BULLETPROOF AUTO-SAVE (Word Online Style)
   * Ensures content is NEVER lost when closing the tab
   */
  useEffect(() => {
    const handleUnloadEmergencySave = (e) => {
      const id = docIdRef.current;
      const ed = editorRef.current;
      
      // ONLY trigger if there are actual unsaved changes and we have a valid editor
      if (hasUnsavedChangesRef.current && id && ed && !ed.isDestroyed) {
        console.log('🚨 EMERGENCY SAVE: Page unloading with unsaved changes. Using Keep-Alive...');
        
        // Validation: must be a real doc (not a temporary template doc)
        const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(id);
        if (!isValidMongoId) {
          if (e) { e.preventDefault(); e.returnValue = ''; }
          return '';
        }

        try {
          const jsonContent = stripBase64Images(ed.state.doc.toJSON());
          const htmlContent = ed.getHTML();
          const tokenUsageData = getTokenUsageForSave(id);

          // 🔥 CRITICAL: Use Keep-Alive transport which is NOT aborted by tab closure
          TextEditorService.updateDocumentKeepAlive(id, {
            title: documentTitleRef.current || 'Untitled Document',
            data: {
              content: jsonContent,
              html: htmlContent
            },
            hasBeenEdited: true,
            ...(tokenUsageData && { metadata: { tokenUsage: tokenUsageData } }),
            updatedAt: new Date()
          });
          
          hasUnsavedChangesRef.current = false;
        } catch (error) {
          console.error('Failed emergency save:', error);
          if (e) { e.preventDefault(); e.returnValue = ''; }
          return '';
        }
      }
    };

    window.addEventListener('beforeunload', handleUnloadEmergencySave);
    return () => {
      window.removeEventListener('beforeunload', handleUnloadEmergencySave);
    };
  }, []);

  return {
    // State
    saveStatus,
    lastSaved,
    isSaving,
    
    // Handlers
    handleSave,
    triggerAutoSave,
    cancelPendingSaves,
    
    // Refs (for internal use)
    docIdRef,
    editorRef,
    documentTitleRef,
  };
}
