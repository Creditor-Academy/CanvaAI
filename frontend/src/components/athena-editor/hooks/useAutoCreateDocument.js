/**
 * useAutoCreateDocument Hook
 * 
 * Production-level hook that automatically creates a new document
 * when user opens the editor without a document ID.
 * 
 * This follows Google Docs pattern where a document is created immediately,
 * ensuring zero data loss and persistent storage from the first millisecond.
 * 
 * @param {string} mongoId - Current document ID (null for new documents)
 * @param {Function} navigate - React Router navigate function
 * @returns {Object} { isCreating, error }
 */

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { TextEditorService } from '../../../services/Text-Editor/text.service.js';

export function useAutoCreateDocument(mongoId, navigate) {
  const [isCreating, setIsCreating] = useState(false);
  const [createdDocId, setCreatedDocId] = useState(null);
  const [error, setError] = useState(null);
  const hasAttemptedCreation = useRef(false);

  useEffect(() => {
    // Convert "undefined" string to actual undefined
    const actualMongoId = (mongoId === 'undefined' || mongoId === null || mongoId === undefined) ? null : mongoId;
    
    console.log('🔍 useAutoCreateDocument called with:', { 
      mongoId, 
      actualMongoId,
      hasAttempted: hasAttemptedCreation.current, 
      isCreating 
    });
    
    // Only attempt creation if:
    // 1. No mongoId (new document)
    // 2. Haven't already attempted creation (prevent loops)
    // 3. Not currently creating (prevent duplicate calls)
    if (actualMongoId || hasAttemptedCreation.current || isCreating) {
      console.log('⏭️ Skipping document creation:', { 
        hasMongoId: !!actualMongoId, 
        hasAttempted: hasAttemptedCreation.current, 
        isCreating 
      });
      return;
    }

    const createNewDocument = async () => {
      // Mark as attempted to prevent infinite loops
      hasAttemptedCreation.current = true;
      setIsCreating(true);
      setError(null);

      try {
        console.log('🆕 Auto-creating new document for persistence...');

        // Create empty document immediately
        const result = await TextEditorService.saveDocument({
          title: 'Untitled Document',
          data: {
            content: {
              type: 'doc',
              content: [
                {
                  type: 'page',
                  content: [
                    { type: 'paragraph' }
                  ]
                }
              ]
            },
            html: '<p></p>'
          },
          hasBeenEdited: false // Mark as not edited - will be cleaned up if user doesn't interact
        });

        console.log('📡 Backend response:', result);

        // 🔥 CRITICAL: Extract document ID from response (handle different response formats)
        // Backend returns: { message: 'Document saved successfully', documentId: '69e0c0e5eb7c41cee880f0f8' }
        const docId = result.documentId || result.id || result._id || result.document?.id || result.document?._id;
        
        console.log('✅ Extracted document ID:', docId);
        
        if (!docId) {
          console.error('❌ Backend did not return document ID. Response:', result);
          throw new Error('Backend did not return document ID');
        }
        
        // 🔥 CRITICAL: Store the created document ID
        setCreatedDocId(docId);
        
        // 🔥 CRITICAL: Also store in sessionStorage for persistence across refreshes
        sessionStorage.setItem('athena_current_doc_id', docId);
        console.log('💾 Stored document ID in sessionStorage:', docId);
        
        // 🔥 CRITICAL: Update URL and ensure navigation completes
        console.log('🔄 Navigating to /editor/', docId);
        
        // Navigate to the new document URL (replace to prevent back navigation to empty state)
        navigate(`/editor/${docId}`, { replace: true });
        
        console.log('✅ Navigation initiated');

        toast.success('New document created');
      } catch (err) {
        console.error('❌ Failed to auto-create document:', err);
        setError(err);
        
        // Show user-friendly error
        toast.error('Failed to create new document. Please try again.', {
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => {
              hasAttemptedCreation.current = false;
              setIsCreating(false);
            }
          }
        });
      } finally {
        setIsCreating(false);
      }
    };

    // Small delay to ensure editor is ready before creating document
    const creationTimer = setTimeout(createNewDocument, 100);

    return () => {
      clearTimeout(creationTimer);
    };
  }, [mongoId, navigate, isCreating]);

  return { isCreating, createdDocId, error };
}

export default useAutoCreateDocument;
