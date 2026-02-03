import { useState } from 'react';
import {
  Download,
  FileText,
  File,
  FileCode,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export const ExportMenu = ({ getHTML, documentTitle }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      window.print();
      toast.success('Opening print dialog for PDF export');
    } catch (error) {
      toast.error('Failed to export as PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsHTML = () => {
    const html = getHTML();
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
  ${html}
</body>
</html>`;
    
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as HTML');
  };

  const exportAsMarkdown = () => {
    const html = getHTML();
    // Simple HTML to Markdown conversion
    let markdown = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<u[^>]*>(.*?)<\/u>/gi, '<u>$1</u>')
      .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<ul[^>]*>|<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>|<\/ol>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as Markdown');
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
    URL.revokeObjectURL(url);
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
          PDF (Print)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsHTML} className="cursor-pointer">
          <FileCode className="w-4 h-4 mr-2" />
          HTML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsMarkdown} className="cursor-pointer">
          <File className="w-4 h-4 mr-2" />
          Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsText} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2" />
          Plain Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};