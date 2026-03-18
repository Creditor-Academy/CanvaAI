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
    
    // Transform backend docs for UI display
    select: (backendDocs) => {
      return backendDocs.map(backendDoc => ({
        id: backendDoc.id,
        title: backendDoc.title || 'Untitled Document',
        createdAt: new Date(backendDoc.createdAt).getTime(),
        updatedAt: new Date(backendDoc.updatedAt).getTime(),
        lastOpened: new Date(backendDoc.updatedAt).getTime(),
        template: 'document',
        pinned: false,
        slideCount: 0,
        isBackend: true
      }));
    },
    
    // 🎯 Key settings for production
    staleTime: 5 * 60 * 1000, // 5 min - no refetch if data is fresh
    gcTime: 10 * 60 * 1000,   // 10 min - keep in cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
}

/**
 * Custom hook for fetching a single document by ID
 */
export function useDocument(documentId) {
  return useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      return await TextEditorService.getDocumentById(documentId);
    },
    
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    
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
