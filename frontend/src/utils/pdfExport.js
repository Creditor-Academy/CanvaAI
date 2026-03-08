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

// Export editor pages to PDF with exact page matching (Google Docs style)
export const exportEditorPagesToPDF = async (options = {}) => {
  const {
    filename = 'document.pdf',
    scale = 2 // Higher scale for better quality
  } = options;

  try {
    // Get all editor page elements
    const pageElements = document.querySelectorAll('.page');
    
    if (pageElements.length === 0) {
      throw new Error('No pages found to export');
    }

    // Create PDF with exact A4 dimensions in points
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt', // Use points for precise A4 matching
      format: 'a4' // Standard A4 format
    });

    // A4 dimensions in points (72 DPI)
    const A4_WIDTH_PT = 595.28;
    const A4_HEIGHT_PT = 841.89;

    console.log(`Exporting ${pageElements.length} pages to PDF...`);

    // Export each page individually
    for (let i = 0; i < pageElements.length; i++) {
      const pageElement = pageElements[i];
      
      // Skip if page is not visible or is a blank placeholder
      if (pageElement.classList.contains('not-reached') || 
          pageElement.querySelector('.page__placeholder')) {
        continue;
      }

      try {
        // Log actual page dimensions for debugging
        const pageRect = pageElement.getBoundingClientRect();
        console.log(`Page ${i + 1} actual dimensions: ${pageRect.width}x${pageRect.height}px`);
        
        // Capture the full page element (not just content) to preserve layout
        const canvas = await html2canvas(pageElement, {
          scale: scale,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          // Remove any transforms that might affect layout
          ignoreElements: (element) => {
            return element.classList?.contains('page__number') || 
                   element.classList?.contains('page__placeholder');
          }
        });

        // Convert canvas to image data
        const imgData = canvas.toDataURL('image/png');

        // Add new page if not the first page
        if (i > 0) {
          pdf.addPage();
        }

        // Calculate aspect ratio to maintain proportions while fitting A4
        const canvasAspectRatio = canvas.width / canvas.height;
        const a4AspectRatio = A4_WIDTH_PT / A4_HEIGHT_PT;
        
        let imgWidth, imgHeight;
        
        if (canvasAspectRatio > a4AspectRatio) {
          // Canvas is wider relative to A4 - fit to width
          imgWidth = A4_WIDTH_PT;
          imgHeight = A4_WIDTH_PT / canvasAspectRatio;
        } else {
          // Canvas is taller relative to A4 - fit to height
          imgHeight = A4_HEIGHT_PT;
          imgWidth = A4_HEIGHT_PT * canvasAspectRatio;
        }

        // Center the image on the page
        const x = (A4_WIDTH_PT - imgWidth) / 2;
        const y = (A4_HEIGHT_PT - imgHeight) / 2;

        // Add the captured page to PDF with proper scaling and centering
        pdf.addImage(
          imgData,
          'PNG',
          x,                    // X position (centered)
          y,                    // Y position (centered)
          imgWidth,             // Scaled width
          imgHeight             // Scaled height
        );

        console.log(`Page ${i + 1} exported (${canvas.width}x${canvas.height} → ${imgWidth}x${imgHeight}pt at ${x},${y})`);

      } catch (pageError) {
        console.warn(`Failed to export page ${i + 1}:`, pageError);
        // Continue with next page instead of failing completely
      }
    }

    // Save the PDF
    pdf.save(filename);
    
    console.log(`PDF exported successfully: ${pdf.getNumberOfPages()} pages`);
    return true;

  } catch (error) {
    console.error('Error exporting editor pages to PDF:', error);
    throw error;
  }
};

// Legacy export function (kept for backward compatibility)
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