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
      margin = { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 }, // Google Docs standard margins (25.4mm = 1 inch)
      theme = "light",
      compress = true
    } = options;

    let toastId = null;

    try {
      toastId = toast.loading('Preparing PDF export...');

      // Initialize PDF with proper settings
      // Use Google Docs dimensions (794px x 1123px) converted to mm
      const googleDocsWidth = 794; // pixels
      const googleDocsHeight = 1123; // pixels
      
      // Convert pixels to mm (assuming 96 DPI -> 1px = 0.264583mm)
      const widthMM = googleDocsWidth * 0.264583;
      const heightMM = googleDocsHeight * 0.264583;
      
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
    const { title, includePageNumbers, includeHeader, includeFooter, margin, theme } = options;
    
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

    // Helper function to get line height - EXACT calculation
    const getLineHeight = (fontSize) => {
      return fontSize * PT_TO_MM * 1.15; // 1.15 is line spacing factor
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
            const lineHeight = getLineHeight(fontSize);
            
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
              lineHeightFactor: 1.15
            });
            
            currentY += requiredHeight + (lineHeight * 0.6); // Proportional spacing
            break;
          }

          case 'paragraph': {
            const fontSize = 11;
            const lineHeight = getLineHeight(fontSize);
            
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
                lineHeightFactor: 1.15
              });
              
              currentY += linesToWrite.length * lineHeight;
              
              if (remainingLines.length > 0) {
                addNewPage();
              }
            }
            
            currentY += lineHeight * 0.6; // Proportional paragraph spacing
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
            const lineHeight = getLineHeight(fontSize);
            
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(fontSize);
            pdf.setTextColor(themeColors.text[0], themeColors.text[1], themeColors.text[2]);
            
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
                
                // Write lines with proper indentation
                linesToWrite.forEach((line, index) => {
                  pdf.text(line, indent, currentY + (index * lineHeight));
                });
                
                currentY += linesToWrite.length * lineHeight;
                
                if (remainingLines.length > 0) {
                  addNewPage();
                }
              }
            }
            
            currentY += lineHeight * 0.6; // Proportional list spacing
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
        case 'heading':
          sections.push({
            type: 'heading',
            level: node.attrs?.level || 1,
            text: this.extractTextFromNode(node)
          });
          break;

        case 'paragraph':
          this.processParagraphNode(node, sections);
          break;

        case 'bulletList':
        case 'orderedList': {
          const items = [];
          this.processListItems(node.content, items, level, node.type === 'orderedList');
          sections.push({
            type: 'list',
            ordered: node.type === 'orderedList',
            items
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
          style: this.extractStyleFromTextNode(node)
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
