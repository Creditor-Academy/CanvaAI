import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TextEditorService } from '../services/Text-Editor/text.service';

/**
 * Custom hook for fetching documents list
 * Production-grade with React Query caching
 */
export function useDocuments(userId = null) {
  return useQuery({
    queryKey: ['documents', userId || 'all'],
    queryFn: async () => {
      const result = await TextEditorService.getAllDocuments(userId);
      return result.documents || [];
    },
    enabled: !!userId,
    
    // 🚀 OPTIMIZED: Aggressive caching for instant loading
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (increased from 5)
    gcTime: 30 * 60 * 1000,    // Keep in memory for 30 minutes (increased from 10)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    
    // Transform backend docs for UI display
    select: (backendDocs) => {
      if (!Array.isArray(backendDocs)) return [];
      return backendDocs.map(backendDoc => ({
        id: backendDoc._id || backendDoc.id,
        title: backendDoc.title || 'Untitled Document',
        createdAt: new Date(backendDoc.createdAt || Date.now()).getTime(),
        updatedAt: new Date(backendDoc.updatedAt || Date.now()).getTime(),
        lastOpened: new Date(backendDoc.updatedAt || Date.now()).getTime(),
        template: 'document',
        pinned: false,
        slideCount: 0,
        isBackend: true
      }));
    },
  });
}

/**
 * Custom hook for fetching a single document by ID
 * Optimized for fast loading with aggressive caching
 */
export function useDocument(documentId) {
  return useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      return await TextEditorService.getDocumentById(documentId);
    },
    
    // 🚀 OPTIMIZED: Instant loading from cache
    staleTime: 30 * 60 * 1000,  // 30 minutes - keep data fresh longer
    gcTime: 60 * 60 * 1000,     // 1 hour - keep in memory
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    
    // Don't fetch if no ID
    enabled: !!documentId,
    
    meta: {
      errorMessage: 'Failed to load document'
    }
  });
}

/**
 * Mutation for saving a new document
 */
export function useSaveDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (documentData) => {
      return await TextEditorService.saveDocument(documentData);
    },
    
    // 🔄 Automatically invalidate documents list after save
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    
    meta: {
      successMessage: 'Document saved successfully',
      errorMessage: 'Failed to save document'
    }
  });
}

/**
 * Mutation for updating a document
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await TextEditorService.updateDocument(id, data);
    },
    
    // 🔄 Invalidate both the document and the list
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    
    meta: {
      successMessage: 'Document updated successfully',
      errorMessage: 'Failed to update document'
    }
  });
}

/**
 * Mutation for deleting a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (documentId) => {
      return await TextEditorService.deleteDocument(documentId);
    },
    
    // 🔄 Optimistic update - remove from cache immediately
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['documents'] });
      
      // Snapshot the previous value
      const previousDocuments = queryClient.getQueryData(['documents']);
      
      // Optimistically remove the document
      if (previousDocuments) {
        queryClient.setQueryData(['documents'], old => 
          old.filter(doc => doc.id !== deletedId)
        );
      }
      
      return { previousDocuments };
    },
    
    // Rollback if error
    onError: (err, deletedId, context) => {
      if (context.previousDocuments) {
        queryClient.setQueryData(['documents'], context.previousDocuments);
      }
    },
    
    // Refetch to ensure sync with backend
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    
    meta: {
      successMessage: 'Document deleted successfully',
      errorMessage: 'Failed to delete document'
    }
  });
}
