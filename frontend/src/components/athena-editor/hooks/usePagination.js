import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

export const usePagination = (editor, zoom, pageSize, pageOrientation) => {
  const [pages, setPages] = useState([{ id: 1, content: '' }]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageCalculationLocked, setIsPageCalculationLocked] = useState(false);

  // Calculate pages based on content and page dimensions
  const calculatePages = useCallback((editorInstance) => {
    if (!editorInstance) return [{ id: 1, content: '' }];

    const content = editorInstance.getHTML();
    // Simplified page calculation - in a real implementation, this would measure content against page dimensions
    return [{ id: 1, content }];
  }, []);

  const updatePages = useCallback((editorInstance) => {
    if (!editorInstance || isPageCalculationLocked) return;

    const newPages = calculatePages(editorInstance);
    setPages(newPages);
  }, [calculatePages, isPageCalculationLocked]);

  const goToPage = useCallback((pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= pages.length) {
      setCurrentPage(pageNumber);
      toast.success(`Navigated to page ${pageNumber}`);
    }
  }, [pages.length]);

  const addNewPage = useCallback(() => {
    const newPage = {
      id: pages.length + 1,
      content: ''
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPage(pages.length + 1);
    toast.success(`Added page ${pages.length + 1}`);
  }, [pages.length]);

  const addPageBreak = useCallback(() => {
    if (editor) {
      editor.commands.setHardBreak();
      // In a real implementation, this would insert a page break element
      toast.success('Page break added');
    }
  }, [editor]);

  const insertPageNumber = useCallback(() => {
    if (editor) {
      // Insert page number at current position
      editor.commands.insertContent(`Page ${currentPage} of ${pages.length}`);
      toast.success('Page number inserted');
    }
  }, [editor, currentPage, pages.length]);

  // Update pages when editor content changes
  useEffect(() => {
    if (editor) {
      const handleUpdate = () => {
        updatePages(editor);
      };

      editor.on('update', handleUpdate);
      return () => {
        editor.off('update', handleUpdate);
      };
    }
  }, [editor, updatePages]);

  return {
    pages,
    currentPage,
    goToPage,
    addNewPage,
    addPageBreak,
    insertPageNumber,
    updatePages
  };
};