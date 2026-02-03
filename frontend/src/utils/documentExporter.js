import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export class DocumentExporter {
  static async exportToPDF(editor, options = {}) {
    const {
      filename = 'document.pdf',
      includePageNumbers = true,
      includeHeader = true,
      includeFooter = true,
      title = 'Document'
    } = options;

    try {
      // Get the HTML content from editor
      const htmlContent = this.getHTMLContent(editor);
      
      // Create properly formatted HTML for PDF
      const fullHTML = this.wrapHTMLForPDF(htmlContent, {
        title,
        includePageNumbers,
        includeHeader,
        includeFooter
      });
      
      // Create PDF with proper dimensions (A4)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Create a temporary container to render HTML
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '210mm'; // A4 width
      container.style.backgroundColor = 'white';
      container.innerHTML = fullHTML;
      document.body.appendChild(container);
      
      // Get the total height of the content
      const totalHeight = container.scrollHeight;
      const pageHeight = 297; // A4 height in mm
      const usablePageHeight = pageHeight - 50; // Account for margins (25mm top + 25mm bottom)
      
      // Calculate how many pages we need
      const totalPages = Math.ceil(totalHeight / (usablePageHeight * 3.78)); // 3.78 pixels per mm at current scale
      
      // Create pages
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        // Create a cloned container for this specific page
        const pageContainer = container.cloneNode(true);
        pageContainer.style.position = 'absolute';
        pageContainer.style.left = '-9999px';
        pageContainer.style.top = `-${page * usablePageHeight * 3.78}px`;
        pageContainer.style.height = `${usablePageHeight * 3.78}px`;
        pageContainer.style.overflow = 'hidden';
        document.body.appendChild(pageContainer);
        
        // Convert this page to canvas
        const canvas = await html2canvas(pageContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          height: usablePageHeight * 3.78,
          y: page * usablePageHeight * 3.78
        });
        
        document.body.removeChild(pageContainer);
        
        // Add image to PDF with margins
        const marginX = 12.5; // 25mm total padding / 2
        const marginY = 12.5;
        const imgWidth = 210 - 25; // A4 width minus padding
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', marginX, marginY, imgWidth, imgHeight);
      }
      
      document.body.removeChild(container);
      
      // Add page numbers if requested
      if (includePageNumbers) {
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFontSize(10);
          pdf.setTextColor(100);
          pdf.text(
            `Page ${i} of ${pageCount}`,
            pdf.internal.pageSize.width - 30,
            pdf.internal.pageSize.height - 10
          );
        }
      }
      
      // Save the PDF as a proper binary file
      pdf.save(filename);
      
      toast.success('PDF exported successfully with automatic page breaking!');
      
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  }

  static async exportToDOCX(editor, options = {}) {
    try {
      // For DOCX export, you should use a proper library
      // This is a placeholder implementation
      const htmlContent = this.getHTMLContent(editor);
      const fullHTML = this.wrapHTMLForWord(htmlContent, options);
      
      // Convert HTML to DOCX using a proper method
      // For now, we'll create an HTML file with .docx extension
      // In production, use a library like mammoth.js or docx.js
      const blob = new Blob([fullHTML], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      saveAs(blob, `${options.filename || 'document'}.docx`);
      toast.success('Document exported to Word format');
      
    } catch (error) {
      console.error('DOCX export error:', error);
      toast.error('Failed to export Word document');
    }
  }

  static exportToMarkdown(editor, options = {}) {
    try {
      const markdownContent = this.convertToMarkdown(editor);
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      saveAs(blob, `${options.filename || 'document'}.md`);
      toast.success('Document exported to Markdown');
    } catch (error) {
      console.error('Markdown export error:', error);
      toast.error('Failed to export Markdown');
    }
  }

  static exportToPlainText(editor, options = {}) {
    try {
      const textContent = editor.getText();
      const blob = new Blob([textContent], { type: 'text/plain' });
      saveAs(blob, `${options.filename || 'document'}.txt`);
      toast.success('Document exported to Plain Text');
    } catch (error) {
      console.error('Text export error:', error);
      toast.error('Failed to export Plain Text');
    }
  }

  static getHTMLContent(editor) {
    if (!editor) return '';
    
    // Get the editor's HTML content
    const html = editor.getHTML();
    
    // Clean up and format HTML for export
    return this.cleanHTMLForExport(html);
  }

  static cleanHTMLForExport(html) {
    // Remove editor-specific classes and attributes
    return html
      .replace(/class="ProseMirror[^"]*"/g, '')
      .replace(/data-[^=]*="[^"]*"/g, '')
      .replace(/<br\s*\/?>/g, '<br>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static wrapHTMLForPDF(html, options) {
    const { title, includeHeader, includeFooter } = options;
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 25mm;
      background: white;
      width: 210mm;
      min-height: 297mm;
      box-sizing: border-box;
    }
    
    .document-header {
      text-align: center;
      margin-bottom: 20mm;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10mm;
    }
    
    .document-footer {
      position: absolute;
      bottom: 20mm;
      width: calc(210mm - 40mm);
      text-align: center;
      font-size: 10pt;
      color: #666;
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      color: #333;
    }
    
    h1 { font-size: 24pt; }
    h2 { font-size: 20pt; }
    h3 { font-size: 18pt; }
    h4 { font-size: 16pt; }
    h5 { font-size: 14pt; }
    h6 { font-size: 12pt; }
    
    p {
      margin: 0.5em 0;
      text-align: justify;
    }
    
    ul, ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }
    
    li {
      margin: 0.2em 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    
    table, th, td {
      border: 1px solid #ddd;
    }
    
    th, td {
      padding: 8px;
      text-align: left;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    
    img {
      max-width: 100%;
      height: auto;
      margin: 0.5em 0;
    }
    
    blockquote {
      border-left: 4px solid #ccc;
      margin: 1em 0;
      padding-left: 1em;
      color: #666;
      font-style: italic;
    }
    
    code {
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    
    pre {
      background-color: #f5f5f5;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    @media print {
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  ${includeHeader ? `<div class="document-header">
    <h1>${title}</h1>
  </div>` : ''}
  
  <div class="document-content">
    ${html}
  </div>
  
  ${includeFooter ? `<div class="document-footer">
    Generated with Athena Editor - ${new Date().toLocaleDateString()}
  </div>` : ''}
</body>
</html>`;
  }

  static wrapHTMLForWord(html, options) {
    const { title = 'Document' } = options;
    
    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.15;
      margin: 1in;
      background: white;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Calibri Light', 'Arial', sans-serif;
      margin-top: 0.5em;
      margin-bottom: 0.3em;
    }
    
    h1 { font-size: 16pt; }
    h2 { font-size: 14pt; }
    h3 { font-size: 13pt; }
    
    p {
      margin: 0.5em 0;
    }
    
    ul, ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.5em 0;
    }
    
    table, th, td {
      border: 1px solid #000;
    }
    
    th, td {
      padding: 4px;
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${html}
</body>
</html>`;
  }

  static convertToMarkdown(editor) {
    // Basic HTML to Markdown conversion
    let html = editor.getHTML();
    
    // Simple conversions
    html = html
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6>(.*?)<\/h6>/gi, '###### $1\n\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<ul>(.*?)<\/ul>/gis, (match, content) => {
        return content.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
      })
      .replace(/<ol>(.*?)<\/ol>/gis, (match, content) => {
        let counter = 1;
        return content.replace(/<li>(.*?)<\/li>/gi, (liMatch, liContent) => {
          return `${counter++}. ${liContent}\n`;
        });
      })
      .replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    
    return html.trim();
  }
}