import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, AlignmentType, ImageRun, BorderStyle, WidthType, PageBreak } from 'docx';
import { toast } from 'sonner';
import JSZip from 'jszip';
import DOMPurify from 'dompurify';

export class DocumentExporter {
  // ==================== PDF EXPORT ====================
  static async exportToPDF(editor, options = {}) {
    const {
      filename = "document.pdf",
      title = "Document",
      author = "Athena Editor",
      includePageNumbers = true,
      includeHeader = true,
      includeFooter = true,
      margin = { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 }, // Docs standard margins (25.4mm = 1 inch)
      theme = "light",
      compress = true
    } = options;

    let toastId = null;

    try {
      toastId = toast.loading('Preparing PDF export...');

      // Initialize PDF with precise A4 at 96dpi
      const DocsWidth = 793.7;   // px (210mm)
      const DocsHeight = 1122.5; // px (297mm)
      
      // Convert pixels to mm (assuming 96 DPI -> 1px = 0.264583mm)
      const widthMM = DocsWidth * 0.264583;
      const heightMM = DocsHeight * 0.264583;
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [widthMM, heightMM],
        compress,
        putOnlyUsedFonts: true,
        hotfixes: ["px_scaling"]
      });

      // Set document properties
      pdf.setProperties({
        title,
        author,
        creator: "Athena Editor",
        producer: "Athena AI",
        creationDate: new Date()
      });

      // Get content from editor
      const content = this.extractStructuredContent(editor);
      
      // Generate PDF pages
      await this.generatePDFPages(pdf, content, {
        title,
        author,
        includePageNumbers,
        includeHeader,
        includeFooter,
        margin,
        theme
      });

      // Save the PDF
      pdf.save(filename);
      
      toast.success(`PDF exported successfully (${pdf.getNumberOfPages()} pages)`);

    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF: ' + error.message);
    } finally {
      if (toastId) toast.dismiss(toastId);
    }
  }

  static async generatePDFPages(pdf, content, options) {
    const { title, includePageNumbers, includeHeader, includeFooter, margin, theme, defaultLineHeight, lineSpacingBoost = 1.2 } = options;
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Fixed conversion: 1pt = 0.3528mm (exact)
    const PT_TO_MM = 0.3528;
    const PX_TO_MM = 0.264583;
    
    // Calculate effective bottom with proper reservations
    const footerHeight = includeFooter ? 12 : 0;
    const pageNumberHeight = includePageNumbers ? 10 : 0;
    const effectiveBottom = pageHeight - margin.bottom - footerHeight - pageNumberHeight;
    
    let currentY = margin.top;

    // Helper to compute line height (pt → mm) honoring per-block lineHeight factor
    const getLineHeight = (fontSize, factor = 1.15) => fontSize * PT_TO_MM * (factor || 1.15);
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const getLF = (style) => {
      const lf = style?.lineHeight;
      const base = (typeof lf === 'number' && lf > 0.5 && lf < 5)
        ? lf
        : (typeof defaultLineHeight === 'number' ? defaultLineHeight : 1.5);
      const boosted = base * (typeof lineSpacingBoost === 'number' ? lineSpacingBoost : 1.2);
      return clamp(boosted, 1.05, 3.0);
    };

    // Helper function to check if new page is needed - FIXED
    const needsNewPage = (requiredHeight) => {
      return currentY + requiredHeight > effectiveBottom;
    };

    // Helper function to add new page - FIXED
    const addNewPage = () => {
      pdf.addPage();
      currentY = margin.top;
      
      if (includeHeader) {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(title, margin.left, margin.top - 5);
        pdf.text(new Date().toLocaleDateString(), pageWidth - margin.right, margin.top - 5, { align: 'right' });
      }
    };

    // Color themes
    const colors = {
      light: {
        text: [0, 0, 0],
        heading: [0, 0, 0],
        muted: [100, 100, 100],
        border: [200, 200, 200],
        code: [245, 245, 245],
        quote: [80, 80, 80]
      },
      dark: {
        text: [255, 255, 255],
        heading: [255, 255, 255],
        muted: [150, 150, 150],
        border: [80, 80, 80],
        code: [30, 30, 30],
        quote: [200, 200, 200]
      }
    };
    
    const themeColors = colors[theme] || colors.light;

    // Title
    if (title && title !== "Untitled Document") {
      const titleFontSize = 16;
      const titleLineHeight = getLineHeight(titleFontSize);
      
      pdf.setFontSize(titleFontSize);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(themeColors.heading[0], themeColors.heading[1], themeColors.heading[2]);
      pdf.text(title, margin.left, currentY);
      currentY += titleLineHeight * 1.5; // Proportional spacing after title
    }

    // Process content with improved page break handling
    for (const section of content) {
      try {
        switch (section.type) {
          case 'heading': {
            const fontSize = 20 - (section.level * 1.5);
            const lf = getLF(section.style);
            const lineHeight = getLineHeight(fontSize, lf);
            
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(fontSize);
            pdf.setTextColor(themeColors.heading[0], themeColors.heading[1], themeColors.heading[2]);
            
            const lines = pdf.splitTextToSize(section.text, pageWidth - margin.left - margin.right);
            const requiredHeight = lines.length * lineHeight;
            
            if (needsNewPage(requiredHeight)) {
              addNewPage();
            }
            
            pdf.text(lines, margin.left, currentY, {
              maxWidth: pageWidth - margin.left - margin.right,
              lineHeightFactor: lf
            });
            
            const afterMM = section.style?.marginAfterMM ?? (lineHeight * 0.4);
            currentY += requiredHeight + afterMM;
            break;
          }

          case 'paragraph': {
            const fontSize = 11;
            const lf = getLF(section.style);
            const lineHeight = getLineHeight(fontSize, lf);
            
            pdf.setFont('helvetica', section.style?.bold ? 'bold' : 'normal');
            pdf.setFontSize(fontSize);
            pdf.setTextColor(themeColors.text[0], themeColors.text[1], themeColors.text[2]);
            
            const lines = pdf.splitTextToSize(section.text, pageWidth - margin.left - margin.right);
            
            // Handle multi-page paragraphs
            let remainingLines = [...lines];
            while (remainingLines.length > 0) {
              // Calculate how many lines fit on current page
              const availableSpace = effectiveBottom - currentY;
              const maxLinesThisPage = Math.floor(availableSpace / lineHeight);
              
              if (maxLinesThisPage <= 0) {
                addNewPage();
                continue;
              }
              
              const linesThisPage = Math.min(maxLinesThisPage, remainingLines.length);
              const linesToWrite = remainingLines.slice(0, linesThisPage);
              remainingLines = remainingLines.slice(linesThisPage);
              
              // Calculate x position based on alignment
              let x = margin.left;
              if (section.style?.align === 'center') {
                x = pageWidth / 2;
              } else if (section.style?.align === 'right') {
                x = pageWidth - margin.right;
              }
              
              pdf.text(linesToWrite, x, currentY, {
                align: section.style?.align || 'left',
                maxWidth: pageWidth - margin.left - margin.right,
                lineHeightFactor: lf
              });
              
              currentY += linesToWrite.length * lineHeight;
              
              if (remainingLines.length > 0) {
                addNewPage();
              }
            }
            const afterMM = section.style?.marginAfterMM ?? (lineHeight * 0.3);
            currentY += afterMM;
            break;
          }
          
          case 'blockquote': {
            const fontSize = 11;
            const lf = getLF(section.style);
            const lineHeight = getLineHeight(fontSize, lf);
            const indent = 6;
            const pad = 1.5;
            const textX = margin.left + indent + 2;
            const maxWidth = pageWidth - textX - margin.right;
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(fontSize);
            pdf.setTextColor(themeColors.quote[0], themeColors.quote[1], themeColors.quote[2]);
            const lines = pdf.splitTextToSize(section.text, maxWidth);
            let remainingLines = [...lines];
            while (remainingLines.length > 0) {
              const availableSpace = effectiveBottom - currentY;
              const maxLinesThisPage = Math.floor(availableSpace / lineHeight);
              if (maxLinesThisPage <= 0) {
                addNewPage();
                continue;
              }
              const linesThisPage = Math.min(maxLinesThisPage, remainingLines.length);
              const linesToWrite = remainingLines.slice(0, linesThisPage);
              remainingLines = remainingLines.slice(linesThisPage);
              pdf.setDrawColor(themeColors.quote[0], themeColors.quote[1], themeColors.quote[2]);
              pdf.setLineWidth(0.6);
              const blockHeight = linesToWrite.length * lineHeight;
              const lineX = margin.left + indent;
              const lineY1 = currentY - pad;
              const lineY2 = currentY + blockHeight + pad;
              pdf.line(lineX, lineY1, lineX, lineY2);
              pdf.text(linesToWrite, textX, currentY + pad, {
                maxWidth,
                lineHeightFactor: lf
              });
              currentY += blockHeight + pad * 2;
              if (remainingLines.length > 0) {
                addNewPage();
              }
            }
            currentY += lineHeight * 0.4;
            break;
          }

          case 'image': {
            const availableWidth = pageWidth - margin.left - margin.right;
            const src = section.src;
            let targetWidthMM = Math.min(availableWidth, (section.width || 400) * PX_TO_MM);
            let targetHeightMM = (section.height ? section.height * PX_TO_MM : targetWidthMM * 0.66);
            if (targetWidthMM <= 0) targetWidthMM = availableWidth;
            if (targetHeightMM <= 0) targetHeightMM = availableWidth * 0.66;
            if (targetWidthMM > availableWidth) {
              const ratio = availableWidth / targetWidthMM;
              targetWidthMM = availableWidth;
              targetHeightMM = targetHeightMM * ratio;
            }
            if (targetHeightMM > (effectiveBottom - currentY)) {
              if (targetHeightMM > (effectiveBottom - margin.top)) {
                const maxHeight = effectiveBottom - margin.top;
                const ratio = maxHeight / targetHeightMM;
                targetHeightMM = maxHeight;
                targetWidthMM = targetWidthMM * ratio;
              } else {
                addNewPage();
              }
            }
            const x =
              section.align === 'center'
                ? margin.left + (availableWidth - targetWidthMM) / 2
                : section.align === 'right'
                ? pageWidth - margin.right - targetWidthMM
                : margin.left;
            const y = currentY;
            const dataUrl = await DocumentExporter.loadImageAsDataUrl(src);
            if (dataUrl) {
              pdf.addImage(dataUrl, 'PNG', x, y, targetWidthMM, targetHeightMM, undefined, 'FAST');
              currentY += targetHeightMM + 4;
            }
            break;
          }

          case 'table': {
            const fontSize = 10;
            const lineHeight = getLineHeight(fontSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(fontSize);
            pdf.setTextColor(themeColors.text[0], themeColors.text[1], themeColors.text[2]);
            const rows = section.rows || [];
            if (rows.length === 0) break;
            const cols = Math.max(...rows.map(r => r.length));
            const tableWidth = pageWidth - margin.left - margin.right;
            const colWidth = tableWidth / cols;
            const cellPadding = 1.5;
            const drawCell = (x, y, w, h) => {
              pdf.setDrawColor(themeColors.border[0], themeColors.border[1], themeColors.border[2]);
              pdf.rect(x, y, w, h);
            };
            for (let r = 0; r < rows.length; r++) {
              const cells = rows[r];
            const cellLines = cells.map((text) => {
                const maxWidth = colWidth - cellPadding * 2;
                return pdf.splitTextToSize(text || '', maxWidth);
              });
              const maxLines = Math.max(...cellLines.map(ls => ls.length || 1));
              const rowHeight = Math.max(lineHeight * maxLines + cellPadding * 2, lineHeight + cellPadding * 2);
              if (needsNewPage(rowHeight)) {
                addNewPage();
              }
              let x = margin.left;
              for (let c = 0; c < cols; c++) {
                const w = colWidth;
                drawCell(x, currentY, w, rowHeight);
                const lines = cellLines[c] || [''];
                const textYStart = currentY + cellPadding + lineHeight;
                for (let li = 0; li < lines.length; li++) {
                  const ty = textYStart + li * lineHeight;
                  pdf.text(lines[li], x + cellPadding, ty, { maxWidth: w - cellPadding * 2 });
                }
                x += w;
              }
              currentY += rowHeight;
            }
            currentY += lineHeight * 0.6;
            break;
          }

          case 'list': {
            const fontSize = 11;
            const lf = getLF(section.style);
            const lineHeight = getLineHeight(fontSize, lf);
            
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(fontSize);
            
            for (const item of section.items) {
              const prefix = section.ordered ? `${item.index}. ` : '• ';
              const indent = margin.left + (item.level * 10);
              const itemText = prefix + item.text;
              
              const lines = pdf.splitTextToSize(itemText, pageWidth - indent - margin.right);
              
              // Handle multi-page list items
              let remainingLines = [...lines];
              while (remainingLines.length > 0) {
                const availableSpace = effectiveBottom - currentY;
                const maxLinesThisPage = Math.floor(availableSpace / lineHeight);
                
                if (maxLinesThisPage <= 0) {
                  addNewPage();
                  continue;
                }
                
                const linesThisPage = Math.min(maxLinesThisPage, remainingLines.length);
                const linesToWrite = remainingLines.slice(0, linesThisPage);
                remainingLines = remainingLines.slice(linesThisPage);
                
                // Write lines with proper indentation and spacing
                pdf.text(linesToWrite, indent, currentY, {
                  maxWidth: pageWidth - indent - margin.right,
                  lineHeightFactor: lf,
                });
                
                currentY += linesToWrite.length * lineHeight;
                
                if (remainingLines.length > 0) {
                  addNewPage();
                }
              }
            }
            
            const afterMM = section.style?.marginAfterMM ?? (lineHeight * 0.25);
            currentY += afterMM;
            break;
          }

          case 'pageBreak': {
            addNewPage();
            break;
          }
          default:
            console.warn('Unknown section type:', section.type);
            break;
        }
      } catch (error) {
        console.error('Error processing section:', section, error);
      }
    }

    // Add footer to all pages if requested
    if (includeFooter || includePageNumbers) {
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        if (includeFooter) {
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text('Generated by Athena Editor', margin.left, pageHeight - 5);
        }
        
        if (includePageNumbers) {
          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin.right, pageHeight - 5, { align: 'right' });
        }
      }
    }
  }

  // ==================== DOCX EXPORT ====================
  static async exportToDOCX(editor, options = {}) {
    const {
      filename = "document.docx",
      title = "Document",
      author = "Athena Editor",
      theme = "light"
    } = options;

    let toastId = null;

    try {
      toastId = toast.loading('Preparing DOCX export...');

      // Get content from editor
      const content = this.extractStructuredContent(editor);
      
      // Create document
      const doc = new Document({
        sections: [{
          properties: {},
          children: this.createDOCXContent(content, { title, author, theme })
        }]
      });

      // Generate and save
      const blob = await Packer.toBlob(doc);
      saveAs(blob, filename);
      
      toast.success('DOCX exported successfully');

    } catch (error) {
      console.error('DOCX export error:', error);
      toast.error('Failed to export DOCX: ' + error.message);
    } finally {
      if (toastId) toast.dismiss(toastId);
    }
  }

  static async printDocument(editor, options = {}) {
    const { title = 'Document' } = options;
    try {
      const html = editor?.getHTML ? editor.getHTML() : '';
      const safe = DOMPurify.sanitize(html || '<p></p>');
      const w = window.open('', '_blank', 'noopener,noreferrer');
      const styles = `
        *{box-sizing:border-box}
        body{font-family:Inter,Arial,sans-serif;padding:0.5in;margin:0;color:#111827;line-height:1.5}
        img{max-width:100%;height:auto;display:block}
        .page{width:794px;min-height:1123px;margin:0 auto;background:#fff}
        .content{padding:96px}
        div[data-type="page-break"]{page-break-after:always;height:0;margin:0;border:none}
        @page { size: A4; margin: 0.5in }
        @media print { body{margin:0} }
      `;
      if (w) {
        w.document.open();
        w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${styles}</style></head><body><div class="page"><div class="content">${safe}</div></div></body></html>`);
        w.document.close();
        w.focus();
        const doPrint = () => {
          setTimeout(() => {
            try { w.print(); } catch { void 0 }
            w.close();
          }, 300);
        };
        if (w.onload === null) {
          w.onload = doPrint;
        } else {
          doPrint();
        }
      } else {
        // Popup blocked – use hidden iframe fallback to print only content
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document;
        if (!doc) {
          document.body.removeChild(iframe);
          throw new Error('Unable to access print frame');
        }
        doc.open();
        doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${styles}</style></head><body><div class="page"><div class="content">${safe}</div></div></body></html>`);
        doc.close();
        iframe.onload = () => {
          setTimeout(() => {
            try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch { void 0 }
            document.body.removeChild(iframe);
          }, 300);
        };
      }
    } catch (e) {
      console.error('Print error:', e);
      toast.error('Failed to print document');
    }
  }

  // ==================== HTML / MD / TXT / EPUB / JSON ====================
  static async exportToHTML(editor, options = {}) {
    const { filename = 'document.html', title = 'Document' } = options;
    const html = editor?.getHTML ? editor.getHTML() : '';
    const safe = DOMPurify.sanitize(html || '<p></p>');
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #111827; line-height: 1.6; }
    h1, h2, h3, h4, h5, h6 { margin: 1.25rem 0 0.5rem; }
    p { margin: 0.5rem 0; }
    blockquote { border-left: 3px solid #94a3b8; padding-left: 1rem; margin-left: 0; color: #475569; }
    img { max-width: 100%; height: auto; display: block; }
    table { border-collapse: collapse; width: 100%; margin: 0.5rem 0; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    th { background-color: #f8fafc; }
  </style>
</head>
<body>${safe}</body>
</html>`;
    const blob = new Blob([fullHTML], { type: 'text/html' });
    saveAs(blob, filename);
  }

  static exportToMarkdown(editor, options = {}) {
    const { filename = 'document.md' } = options;
    const html = editor?.getHTML ? editor.getHTML() : '';
    const safe = DOMPurify.sanitize(html || '');
    // Simple HTML → Markdown conversion
    let md = safe
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<u[^>]*>(.*?)<\/u>/gi, '<u>$1</u>')
      .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
      .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (m, p1) => {
        const text = p1.replace(/<[^>]+>/g, '').trim();
        return text ? `> ${text}\n\n` : '';
      })
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<\/(ul|ol)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    const blob = new Blob([md], { type: 'text/markdown' });
    saveAs(blob, filename);
  }

  static exportToPlainText(editor, options = {}) {
    const { filename = 'document.txt' } = options;
    const html = editor?.getHTML ? editor.getHTML() : '';
    const safe = DOMPurify.sanitize(html || '');
    const text = safe
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
    const blob = new Blob([text], { type: 'text/plain' });
    saveAs(blob, filename);
  }

  static async exportToJSON(editor, options = {}) {
   const { filename = 'document.json', includePagination= true } = options;
    
    if (!editor) {
      throw new Error('Editor not available');
    }

   const json = editor.getJSON ? editor.getJSON() : {};
    
    // If pagination is requested, calculate and add page structure
    if (includePagination) {
     const paginationData = this.calculatePaginationForExport(editor);
      
     const enrichedJson = {
        ...json,
        metadata: {
          ...json.metadata,
          exportedAt: new Date().toISOString(),
         paginationEnabled: true,
          totalPages: paginationData.totalPages,
          usableHeightPerContent: paginationData.usableHeight,
         margins: {
            top: paginationData.marginTop,
            bottom: paginationData.marginBottom,
            left: paginationData.marginLeft,
            right: paginationData.marginRight
          }
        },
       pages: paginationData.pages
      };
      
     const blob = new Blob([JSON.stringify(enrichedJson, null, 2)], { type: 'application/json' });
      saveAs(blob, filename);
    } else {
     const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      saveAs(blob, filename);
    }
  }

  /**
   * Calculate pagination structure that matches what's visible on screen per page
   * Uses the EXACT same layout calculator as the virtual scroll pagination engine
   */
  static calculatePaginationForExport(editor) {
    // Import the ACTUAL pagination engine functions
   const { calculateFullBlockHeight, blockMarginBottom } = require('./pagination/layoutCalculator');
   const { USABLE_HEIGHT_PX, USABLE_WIDTH_PX, PAGE_MARGIN_TOP_PX, PAGE_MARGIN_BOTTOM_PX, PAGE_MARGIN_LEFT_PX, PAGE_MARGIN_RIGHT_PX } = require('./pagination/constants');
    
   const content = this.extractStructuredContent(editor);
    
   const pages = [];
    let currentPage = {
     pageNumber: 1,
      blocks: [],
      usedHeight: 0,
      availableHeight: USABLE_HEIGHT_PX
    };
    
    // Process each content block and assign to pages
    // This logic MATCHES paginationEngine.js paginate() method
    for (const block of content) {
      // Convert extracted block back to ProseMirror-like node structure
     const proseMirrorNode = this.convertBlockToProseMirrorNode(block);
      
      // Use the REAL layout calculator (same as virtual scroll)
     const fullHeight = calculateFullBlockHeight(proseMirrorNode, {}, USABLE_WIDTH_PX);
      
      // Check if block fits on current page (MATCHES paginationEngine.js line 124)
      if (currentPage.usedHeight + fullHeight > USABLE_HEIGHT_PX) {
        // Save current page and start new one
       pages.push(currentPage);
        currentPage = {
         pageNumber: pages.length + 1,
          blocks: [],
          usedHeight: 0,
          availableHeight: USABLE_HEIGHT_PX
        };
      }
      
      // Add block to current page with EXACT height calculation
      currentPage.blocks.push({
        ...block,
       height: fullHeight,  // Full layout height including margin-bottom
       contentHeight: fullHeight - blockMarginBottom(proseMirrorNode),
       marginBottom: blockMarginBottom(proseMirrorNode),
        positionInPage: currentPage.blocks.length
      });
      currentPage.usedHeight += fullHeight;
    }
    
    // Add the last page
    if (currentPage.blocks.length > 0) {
     pages.push(currentPage);
    }
    
    return {
     pages,
      totalPages: pages.length,
      usableHeight: USABLE_HEIGHT_PX,
      usableWidth: USABLE_WIDTH_PX,
     marginTop: PAGE_MARGIN_TOP_PX,
     marginBottom: PAGE_MARGIN_BOTTOM_PX,
     marginLeft: PAGE_MARGIN_LEFT_PX,
     marginRight: PAGE_MARGIN_RIGHT_PX
    };
  }

  /**
   * Convert extracted block back to ProseMirror-like node for layout calculator
   */
  static convertBlockToProseMirrorNode(block) {
    // Create a minimal ProseMirror-like node structure
    // that the layout calculator can work with
    return {
      type: { name: block.type },
      attrs: {
        level: block.level,
        ...block.attrs
      },
     content: block.content ? {
        forEach: (fn) => {
          if (Array.isArray(block.content)) {
            block.content.forEach(fn);
          }
        }
      } : null,
      textContent: block.text || '',
      text: block.text || ''
    };
  }

  /**
   * Calculate the height a block will occupy on a page
   * This matches the layout calculator used by the virtual scroll pagination
   */
  static calculateBlockHeight(block, usableWidth) {
   const DEFAULT_FONT_SIZE = 16;
   const DEFAULT_LINE_HEIGHT = 1.5;
   const PADDING_BOTTOM = 12; // Standard paragraph spacing
    
    switch (block.type) {
      case 'heading': {
       const sizes = { 1: 32, 2: 28, 3: 24, 4: 20, 5: 18, 6: 16 };
       const fontSize = sizes[block.level] || DEFAULT_FONT_SIZE;
       const lineHeight= fontSize * DEFAULT_LINE_HEIGHT;
       const lines = Math.ceil(block.text.length / (usableWidth * 0.15)); // Approx chars per line
        return (lines * lineHeight) + PADDING_BOTTOM;
      }
      
      case 'paragraph': {
       const fontSize = block.style?.fontSize || DEFAULT_FONT_SIZE;
       const lineHeight = fontSize * (block.style?.lineHeight || DEFAULT_LINE_HEIGHT);
       const charsPerLine = Math.floor(usableWidth * 0.6); // Approx based on font size
       const lines = Math.ceil((block.text.length || 1) / charsPerLine);
        return (lines * lineHeight) + PADDING_BOTTOM;
      }
      
      case 'blockquote': {
       const fontSize = DEFAULT_FONT_SIZE;
       const lineHeight = fontSize * DEFAULT_LINE_HEIGHT;
       const charsPerLine = Math.floor(usableWidth * 0.55);
       const lines= Math.ceil((block.text.length || 1) / charsPerLine);
        return (lines * lineHeight) + PADDING_BOTTOM + 16; // Extra padding for quote styling
      }
      
      case 'list': {
       const fontSize = DEFAULT_FONT_SIZE;
       const lineHeight = fontSize * DEFAULT_LINE_HEIGHT;
        let totalHeight= 0;
        
        for (const item of block.items) {
         const charsPerLine = Math.floor(usableWidth * 0.55);
         const lines = Math.ceil((item.text.length || 1) / charsPerLine);
          totalHeight += (lines * lineHeight) + 4; // Item spacing
        }
        
        return totalHeight + PADDING_BOTTOM;
      }
      
      case 'image': {
       const aspectRatio = block.height / block.width;
       const displayWidth = Math.min(block.width, usableWidth);
       const displayHeight = displayWidth * aspectRatio;
        return displayHeight + PADDING_BOTTOM;
      }
      
      case 'table': {
       const rowHeight= 30; // Approximate row height
       const headerHeight= 35;
       const numRows = block.rows?.length || 0;
        return headerHeight + (numRows * rowHeight) + PADDING_BOTTOM;
      }
      
      case 'pageBreak': {
        return USABLE_HEIGHT; // Force new page
      }
      
      default: {
        // Default estimation for unknown types
        return 40 + PADDING_BOTTOM;
      }
    }
  }

  static async exportToEPUB(editor, options = {}) {
    const { filename = 'document.epub', title = 'Document', author = 'Athena Editor' } = options;
    
    let toastId = null;
    
    try {
      toastId = toast.loading('Preparing EPUB export...');
      
      const html = editor?.getHTML ? editor.getHTML() : '';
      const safe = DOMPurify.sanitize(html || '<p></p>');

      const zip = new JSZip();
      
      // Required EPUB files
      zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
      
      // META-INF/container.xml
      zip.folder('META-INF').file('container.xml',
        `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

      // OEBPS folder
      const oebps = zip.folder('OEBPS');
      
      // Content XHTML
      oebps.file('content.xhtml',
        `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>${title}</h1>
${safe}
</body>
</html>`);
      
      // Styles CSS
      oebps.file('styles.css',
        `body {
  font-family: Georgia, serif;
  line-height: 1.6;
  margin: 1em;
  color: #333;
}
h1, h2, h3, h4, h5, h6 {
  margin: 1.2em 0 0.5em;
  font-weight: bold;
}
h1 { font-size: 2em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.25em; }
p {
  margin: 0.8em 0;
  text-indent: 1.5em;
}
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}
blockquote {
  border-left: 3px solid #999;
  padding-left: 1em;
  margin: 1em 0;
  color: #555;
  font-style: italic;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}
th, td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #f5f5f5;
  font-weight: bold;
}
ul, ol {
  margin: 0.8em 0;
  padding-left: 2em;
}
li {
  margin: 0.3em 0;
}
code {
  font-family: monospace;
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
}
pre {
  background-color: #f5f5f5;
  padding: 1em;
  overflow-x: auto;
  border: 1px solid #ddd;
}`);
      
      // Content OPF (package file)
      oebps.file('content.opf',
        `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()}</dc:identifier>
    <dc:title>${title}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:language>en</dc:language>
    <dc:publisher>Athena Editor</dc:publisher>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
  </metadata>
  <manifest>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="content"/>
  </spine>
</package>`);

      // Generate and save
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, filename);
      
      toast.success('EPUB exported successfully! 📚');
      
    } catch (error) {
      console.error('EPUB export error:', error);
      toast.error('Failed to export EPUB: ' + error.message);
    } finally {
      if (toastId) toast.dismiss(toastId);
    }
  }

  static createDOCXContent(content, options) {
    const { title } = options;
    const children = [];

    // Add title
    if (title && title !== "Untitled Document") {
      children.push(new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 240 }
      }));
    }

    // Process content
    for (const section of content) {
      switch (section.type) {
        case 'heading':
          children.push(new Paragraph({
            text: section.text,
            heading: this.getHeadingLevel(section.level),
            spacing: { after: 120 }
          }));
          break;

        case 'paragraph':
          children.push(new Paragraph({
            text: section.text,
            spacing: { after: 120 }
          }));
          break;

        case 'list':
          section.items.forEach(item => {
            children.push(new Paragraph({
              text: (section.ordered ? `${item.index}. ` : '• ') + item.text,
              indent: { left: item.level * 360 },
              spacing: { after: 60 }
            }));
          });
          break;

        default:
          console.warn('Unknown section type:', section.type);
          break;
      }
    }

    return children;
  }

  static getHeadingLevel(level) {
    const levels = [
      HeadingLevel.HEADING_1,
      HeadingLevel.HEADING_2,
      HeadingLevel.HEADING_3,
      HeadingLevel.HEADING_4,
      HeadingLevel.HEADING_5,
      HeadingLevel.HEADING_6
    ];
    return levels[Math.min(level - 1, levels.length - 1)] || HeadingLevel.HEADING_6;
  }

  // ==================== CONTENT EXTRACTION ====================
  static extractStructuredContent(editor) {
    if (!editor) return [];
    
    const content = editor.getJSON();
    const sections = [];
    
    if (content.content) {
      this.processContentNodes(content.content, sections);
    }
    
    return sections;
  }

  static processContentNodes(nodes, sections, level = 0) {
    for (const node of nodes) {
      switch (node.type) {
        case 'pageBreak':
          sections.push({ type: 'pageBreak' });
          break;
        case 'heading':
          sections.push({
            type: 'heading',
            level: node.attrs?.level || 1,
            text: this.extractTextFromNode(node),
            style: this.extractBlockStyle(node)
          });
          break;

        case 'paragraph':
          this.processParagraphNode(node, sections);
          break;
        
        case 'blockquote':
          sections.push({
            type: 'blockquote',
            text: this.extractTextFromNode(node)
          });
          break;

        case 'bulletList':
        case 'orderedList': {
          const items = [];
          this.processListItems(node.content, items, level, node.type === 'orderedList');
          sections.push({
            type: 'list',
            ordered: node.type === 'orderedList',
            items,
            style: this.extractBlockStyle(node)
          });
          break;
        }

        case 'listItem':
          if (node.content) {
            this.processContentNodes(node.content, sections, level);
          }
          break;

        case 'table':
          sections.push({
            type: 'table',
            rows: this.extractTableRows(node)
          });
          break;

        case 'image':
          sections.push({
            type: 'image',
            src: node.attrs?.src || '',
            width: node.attrs?.width || 400,
            height: node.attrs?.height || 300,
            align: node.attrs?.align || 'left'
          });
          break;

        case 'resizableImage':
          sections.push({
            type: 'image',
            src: node.attrs?.src || '',
            width: node.attrs?.width || 400,
            height: node.attrs?.height || 300,
            align: node.attrs?.align || 'left'
          });
          break;

        default:
          if (node.content) {
            this.processContentNodes(node.content, sections, level);
          }
          break;
      }
    }
  }

  static processParagraphNode(node, sections) {
    if (!node || !node.content) {
      return;
    }
    let buffer = '';
    const flushBuffer = () => {
      const text = buffer.trim();
      if (text) {
        sections.push({
          type: 'paragraph',
          text,
          style: {
            ...this.extractStyleFromTextNode(node),
            ...this.extractBlockStyle(node)
          }
        });
      }
      buffer = '';
    };
    for (const child of node.content) {
      if (child.type === 'resizableImage' || child.type === 'image') {
        flushBuffer();
        sections.push({
          type: 'image',
          src: child.attrs?.src || '',
          width: child.attrs?.width || 400,
          height: child.attrs?.height || 300,
          align: child.attrs?.align || 'left'
        });
      } else if (child.text) {
        buffer += child.text;
      } else if (child.content) {
        buffer += this.extractTextFromNode(child);
      }
    }
    flushBuffer();
  }

  static extractTableRows(tableNode) {
    const rows = [];
    if (!tableNode || !tableNode.content) return rows;
    for (const row of tableNode.content) {
      if (row.type !== 'tableRow' || !row.content) continue;
      const cells = [];
      for (const cell of row.content) {
        if ((cell.type === 'tableCell' || cell.type === 'tableHeader') && cell.content) {
          const text = this.extractTextFromNode({ content: cell.content });
          cells.push(text);
        }
      }
      rows.push(cells);
    }
    return rows;
  }

  static processListItems(nodes, items, level, ordered, index = 1) {
    for (const node of nodes) {
      if (node.type === 'listItem') {
        if (node.content) {
          const textContent = this.extractTextFromNode({ content: node.content });
          if (textContent.trim()) {
            items.push({
              text: textContent,
              level,
              index: ordered ? index++ : null
            });
          }
          
          // Process nested lists
          for (const child of node.content) {
            if (child.type === 'bulletList' || child.type === 'orderedList') {
              this.processListItems(
                child.content, 
                items, 
                level + 1, 
                child.type === 'orderedList',
                index
              );
            }
          }
        }
      }
    }
  }

  static extractTextFromNode(node) {
    if (!node || !node.content) return '';
    
    let text = '';
    for (const child of node.content) {
      if (child.type === 'resizableImage' || child.type === 'image') {
        text += '';
      } else if (child.text) {
        text += child.text;
      } else if (child.content) {
        text += this.extractTextFromNode(child);
      }
    }
    return text;
  }

  static extractStyleFromTextNode(node) {
    if (!node || !node.content) return {};
    const style = {};
    for (const child of node.content) {
      if (child.marks) {
        for (const mark of child.marks) {
          if (mark.type === 'bold') style.bold = true;
          if (mark.type === 'italic') style.italic = true;
        }
      }
    }
    return style;
  }

  static extractStyleFromNode(node) {
    if (!node || !node.content) return {};
    
    const style = {};
    
    // Check for bold/italic marks
    for (const child of node.content) {
      if (child.marks) {
        for (const mark of child.marks) {
          if (mark.type === 'bold') style.bold = true;
          if (mark.type === 'italic') style.italic = true;
        }
      }
    }
    
    return style;
  }

  // Extract per-block style attributes (line-height, text align, margins)
  static extractBlockStyle(node) {
    const style = {};
    const PX_TO_MM = 0.264583;
    // line-height factor (editor stores numeric like 1, 1.15, 1.5)
    if (node?.attrs?.lineHeight) {
      const lf = parseFloat(node.attrs.lineHeight);
      if (!Number.isNaN(lf) && lf > 0.5 && lf < 5) style.lineHeight = lf;
    }
    // text align
    if (node?.attrs?.textAlign) {
      style.align = node.attrs.textAlign;
    }
    // margin-top / margin-bottom encoded in 'style' attribute (e.g. "margin-top: 8px; margin-bottom: 6px")
    if (node?.attrs?.style && typeof node.attrs.style === 'string') {
      const mt = /margin-top:\s*([0-9.]+)px/i.exec(node.attrs.style);
      const mb = /margin-bottom:\s*([0-9.]+)px/i.exec(node.attrs.style);
      if (mt) {
        const px = parseFloat(mt[1]);
        if (!Number.isNaN(px)) style.marginBeforeMM = px * PX_TO_MM;
      }
      if (mb) {
        const px = parseFloat(mb[1]);
        if (!Number.isNaN(px)) style.marginAfterMM = px * PX_TO_MM;
      }
    }
    return style;
  }

  static async loadImageAsDataUrl(src) {
    if (!src) return null;
    if (src.startsWith('data:')) {
      return src;
    }
    try {
      const response = await fetch(src, { mode: 'cors' });
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
}
