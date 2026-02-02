import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { DocumentExporter } from '../../../utils/documentExporter';

export const useExportState = () => {
  const [exportLoading, setExportLoading] = useState({
    pdf: false,
    docx: false,
    html: false,
    md: false,
    txt: false
  });
  
  const [exportProgress, setExportProgress] = useState({
    currentStep: '',
    totalSteps: 0,
    completedSteps: 0
  });

  const updateExportState = useCallback((format, loading) => {
    setExportLoading(prev => ({
      ...prev,
      [format]: loading
    }));
  }, []);

  const updateProgress = useCallback((step, total, completed) => {
    setExportProgress({
      currentStep: step,
      totalSteps: total,
      completedSteps: completed
    });
  }, []);

  const exportToPDF = useCallback(async (editor, options = {}) => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    try {
      updateExportState('pdf', true);
      updateProgress('Preparing', 3, 0);
      
      // Call the actual export function which handles its own toasts
      await DocumentExporter.exportToPDF(editor, options);
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(`PDF export failed: ${error.message}`);
    } finally {
      updateExportState('pdf', false);
      updateProgress('', 0, 0);
    }
  }, [updateExportState, updateProgress]);

  const exportToDOCX = useCallback(async (editor, options = {}) => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    try {
      updateExportState('docx', true);
      await DocumentExporter.exportToDOCX(editor, options);
    } catch (error) {
      console.error('DOCX export error:', error);
      toast.error(`DOCX export failed: ${error.message}`);
    } finally {
      updateExportState('docx', false);
    }
  }, [updateExportState]);

  const exportToHTML = useCallback(async (editor, options = {}) => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    try {
      updateExportState('html', true);
      await DocumentExporter.exportToHTML(editor, options);
    } catch (error) {
      console.error('HTML export error:', error);
      toast.error(`HTML export failed: ${error.message}`);
    } finally {
      updateExportState('html', false);
    }
  }, [updateExportState]);

  const exportToMarkdown = useCallback(async (editor, options = {}) => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    try {
      updateExportState('md', true);
      DocumentExporter.exportToMarkdown(editor, options);
    } catch (error) {
      console.error('Markdown export error:', error);
      toast.error(`Markdown export failed: ${error.message}`);
    } finally {
      updateExportState('md', false);
    }
  }, [updateExportState]);

  const exportToPlainText = useCallback(async (editor, options = {}) => {
    if (!editor) {
      toast.error('Editor not available');
      return;
    }

    try {
      updateExportState('txt', true);
      DocumentExporter.exportToPlainText(editor, options);
    } catch (error) {
      console.error('Plain text export error:', error);
      toast.error(`Plain text export failed: ${error.message}`);
    } finally {
      updateExportState('txt', false);
    }
  }, [updateExportState]);

  return {
    exportLoading,
    exportProgress,
    exportToPDF,
    exportToDOCX,
    exportToHTML,
    exportToMarkdown,
    exportToPlainText,
    updateExportState,
    updateProgress
  };
};