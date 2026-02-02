// src/utils/pdfExport.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPDF = async (elementId, options = {}) => {
  const {
    filename = 'document.pdf',
    margin = 20,
    orientation = 'portrait',
    unit = 'mm',
    format = 'a4',
    quality = 1,
    includePageNumbers = true,
    includeHeader = true,
    includeFooter = true
  } = options;

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Store original styles to restore later
    const originalOverflow = element.style.overflow;
    element.style.overflow = 'visible';

    // Create canvas from element
    const canvas = await html2canvas(element, {
      scale: quality,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    // Restore original styles
    element.style.overflow = originalOverflow;

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    // Initialize PDF
    const pdf = new jsPDF({
      orientation: orientation === 'portrait' ? 'p' : 'l',
      unit: unit,
      format: format,
      compress: true
    });

    // Add header if enabled
    if (includeHeader) {
      const date = new Date().toLocaleDateString();
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Generated: ${date}`, margin, 10);
    }

    // Add first page
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      margin,
      position + (includeHeader ? 15 : 0),
      imgWidth - (margin * 2),
      imgHeight,
      undefined,
      'FAST'
    );

    heightLeft -= (pageHeight - (includeHeader ? 35 : margin * 2) - (includeFooter ? 20 : 0));

    // Add additional pages if content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      
      // Add header to subsequent pages
      if (includeHeader) {
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(`Page ${pdf.internal.getNumberOfPages()}`, margin, 10);
      }

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        margin,
        position + (includeHeader ? 15 : 0),
        imgWidth - (margin * 2),
        imgHeight,
        undefined,
        'FAST'
      );
      
      heightLeft -= pageHeight;
    }

    // Add page numbers if enabled
    if (includePageNumbers) {
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
    }

    // Add footer if enabled
    if (includeFooter) {
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
          'Generated with Athena Editor',
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        );
      }
    }

    // Save the PDF
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const exportEditorContentToPDF = async (editorContent, options = {}) => {
  const {
    filename = 'document.pdf',
    margin = 20,
    orientation = 'portrait',
    format = 'a4'
  } = options;

  try {
    // Create a temporary container
    const tempDiv = document.createElement('div');
    tempDiv.id = 'temp-pdf-export';
    tempDiv.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 210mm;
      min-height: 297mm;
      padding: ${margin}mm;
      background: white;
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
    `;
    
    // Add the editor content
    tempDiv.innerHTML = editorContent;
    
    // Append to body
    document.body.appendChild(tempDiv);
    
    // Export to PDF
    await exportToPDF('temp-pdf-export', {
      ...options,
      filename
    });
    
    // Clean up
    document.body.removeChild(tempDiv);
    
    return true;
  } catch (error) {
    console.error('Error exporting editor content to PDF:', error);
    throw error;
  }
};