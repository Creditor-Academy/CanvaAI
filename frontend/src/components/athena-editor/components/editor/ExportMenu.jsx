import { useState } from 'react';
import {
  Download,
  FileText,
  File,
  FileCode,
  ChevronDown,
  Book,
  BookOpen,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { exportEditorPagesToPDF } from '../../../../utils/pdfExport';
import TurndownService from 'turndown';

export const ExportMenu = ({ getHTML, documentTitle }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportAsPDF = async () => {
    // Open window IMMEDIATELY before any await - guarantees user gesture context
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Popup blocked. Please allow popups for PDF export.');
      return;
    }
    
    setIsExporting(true);
    try {
      // Use the new page-based PDF export that matches editor pages exactly
      await exportEditorPagesToPDF({
        filename: `${documentTitle || 'document'}.pdf`,
        scale: 2 // High quality export
      });
      
      // Primary export succeeded - close the blank window we opened
      printWin.close();
      toast.success('PDF exported successfully with exact page matching');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(`Failed to export as PDF: ${error.message}`);
      
      // Fallback: Use the already-open window for print-to-PDF
      try {
        const raw = typeof getHTML === 'function' ? getHTML() : '';
        const safe = DOMPurify.sanitize(raw || '<p></p>');
        
        const styles = `
          *{box-sizing:border-box}
          body{font-family:Inter,Arial,sans-serif;margin:0;color:#111827;line-height:1.5}
          img{max-width:100%;height:auto;display:block}
          .page{width:100%;margin:0 auto;background:#fff;display:block;}
          .content{padding:40px}
          div[data-type="page-break"]{page-break-after:always;break-after:page;height:0;margin:0;border:none;display:block;visibility:hidden;}
          ul, ol, li { page-break-inside: avoid; break-inside: avoid; }
          p { page-break-inside: auto; }
          @page { size: A4; margin: 0.5in; }
          @media print { body{margin:0} .page{min-height:auto} }
        `;
        
        // Write fallback content to the already-open window
        printWin.document.open();
        printWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${documentTitle || 'Document'}</title><style>${styles}</style></head><body><div class="page"><div class="content">${safe}</div></div></body></html>`);
        printWin.document.close();
        printWin.focus();
        
        setTimeout(() => {
          try { printWin.print(); } catch { void 0 }
          // Don't close immediately - let user review before closing
          setTimeout(() => printWin.close(), 1000);
        }, 300);
        
        toast.success('Opening print dialog for PDF export (fallback method)');
      } catch (printError) {
        console.error('Print fallback also failed:', printError);
        toast.error('Both PDF export methods failed');
        printWin.close(); // Clean up the blank window
      }
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsHTML = () => {
    const html = getHTML();
    // Fix: Sanitize HTML before export to prevent XSS in exported files
    const safe = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 's', 'code', 'pre', 'a', 'blockquote', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'span', 'br', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'style', 'colspan', 'rowspan', 'width', 'height']
    });
    
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1, h2, h3 { margin-top: 1.5em; }
    p { line-height: 1.6; }
    blockquote { border-left: 3px solid #ccc; padding-left: 1rem; margin-left: 0; color: #666; }
    code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f4f4f4; }
  </style>
</head>
<body>
  ${safe}
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle}.html`;
    a.click();
    
    // Revoke AFTER the click event has been processed
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    toast.success('Exported as HTML');
  };

  const exportAsMarkdown = () => {
    try {
      // Use Turndown for proper HTML to Markdown conversion
      const td = new TurndownService({
        headingStyle: 'atx',      // Use # style headings
        codeBlockStyle: 'fenced', // Use ``` code blocks
        bulletListMarker: '-',    // Use - for lists
        emDelimiter: '*',         // Use * for emphasis
        strongDelimiter: '**'     // Use ** for strong
      });
      
      // Add custom rules for better handling
      td.addRule('table', {
        filter: ['table'],
        replacement: (content, node) => {
          // Convert tables to markdown-style tables
          return '\n\n' + content + '\n\n';
        }
      });
      
      td.addRule('codeBlock', {
        filter: (node) => {
          return node.nodeName === 'PRE' && node.querySelector('code');
        },
        replacement: (content, node) => {
          const code = node.querySelector('code');
          const language = code?.className?.replace('language-', '') || '';
          return '\n\n```' + language + '\n' + code?.textContent + '\n```\n\n';
        }
      });
      
      const html = getHTML();
      const markdown = td.turndown(html);
      
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentTitle}.md`;
      a.click();
      
      // CRITICAL FIX: Revoke AFTER the click event has been processed
      // The click triggers an async file download; revoking immediately fails in Safari/Firefox
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      toast.success('Exported as Markdown');
    } catch (error) {
      console.error('Markdown export error:', error);
      toast.error('Failed to export as Markdown');
    }
  };

  const exportAsText = () => {
    const html = getHTML();
    const text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle}.txt`;
    a.click();
    
    // Revoke AFTER the click event has been processed
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    toast.success('Exported as plain text');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          Export
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border shadow-lg min-w-[160px]">
        <DropdownMenuItem onClick={exportAsPDF} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2" />
          PDF (Exact Pages)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsHTML} className="cursor-pointer">
          <FileCode className="w-4 h-4 mr-2" />
          HTML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsMarkdown} className="cursor-pointer">
          <File className="w-4 h-4 mr-2" />
          Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info('EPUB export is available in the main Export dialog')} className="cursor-pointer">
          <Book className="w-4 h-4 mr-2" />
          EPUB eBook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsText} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2" />
          Plain Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info('JSON export is available in the main Export dialog')} className="cursor-pointer">
          <FileCode className="w-4 h-4 mr-2" />
          JSON Data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
