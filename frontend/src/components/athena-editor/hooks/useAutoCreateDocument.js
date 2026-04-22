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
 * @param {string} templateType - Optional template type (blank, resume, report, etc.)
 * @returns {Object} { isCreating, error }
 */

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { TextEditorService } from '../../../services/Text-Editor/text.service.js';

// Template content map for initial document content
const TEMPLATE_CONTENT = {
  blank: {
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
  resume: {
    content: {
      type: 'doc',
      content: [
        {
          type: 'page',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Your Name' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Email: you@email.com | Phone: +1 555-000-0000' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Summary' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Experienced professional with a track-record of delivering results...' }] }
          ]
        }
      ]
    },
    html: '<h1>Your Name</h1><p>Email: you@email.com | Phone: +1 555-000-0000</p><h2>Summary</h2><p>Experienced professional with a track-record of delivering results...</p>'
  },
  report: {
    content: {
      type: 'doc',
      content: [
        {
          type: 'page',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Project Proposal' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Executive Summary' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'This proposal outlines the plan for [Project Name]...' }] }
          ]
        }
      ]
    },
    html: '<h1>Project Proposal</h1><h2>Executive Summary</h2><p>This proposal outlines the plan for [Project Name]...</p>'
  },
  letter: {
    content: {
      type: 'doc',
      content: [
        {
          type: 'page',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: new Date().toLocaleDateString() }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Dear [Name],' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'I am writing to [purpose of the letter]...' }] }
          ]
        }
      ]
    },
    html: `<p>${new Date().toLocaleDateString()}</p><p>Dear [Name],</p><p>I am writing to [purpose of the letter]...</p>`
  }
};

export function useAutoCreateDocument(mongoId, navigate, templateType = 'blank') {
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
      templateType,
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
        console.log(`🆕 Auto-creating new document for persistence (template: ${templateType})...`);

        // Get template content or default to blank
        const effectiveTemplate = templateType || 'blank';
        const template = TEMPLATE_CONTENT[effectiveTemplate] || TEMPLATE_CONTENT.blank;
        const title = effectiveTemplate === 'blank' ? 'Untitled Document' : `New ${effectiveTemplate.charAt(0).toUpperCase() + effectiveTemplate.slice(1)}`;

        // Create document with template content
        const result = await TextEditorService.saveDocument({
          title,
          data: template,
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

        toast.success(`New ${effectiveTemplate} document created`);
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
  }, [mongoId, navigate, isCreating, templateType]);

  return { isCreating, createdDocId, error };
}

export default useAutoCreateDocument;
